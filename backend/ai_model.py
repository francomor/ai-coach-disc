import base64
import io
import logging
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from langchain.schema import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pdf2image import convert_from_path
from sqlalchemy.orm import Session
from werkzeug.datastructures import file_storage
from werkzeug.utils import secure_filename

from .models import FileStorage, Message, PromptConfig

logging.basicConfig(level=logging.INFO)


chat_models: Dict[int, ChatOpenAI] = {}


def predict(
    history: List[Message],
    group_id: int,
    processed_summary: str,
    session: Session,
    participant_processed_summary: Optional[str],
) -> str:
    """Generate a prediction for chat history with group-specific context."""
    prompt_config = session.query(PromptConfig).filter_by(group_id=group_id).first()
    if not prompt_config:
        raise ValueError("Prompt configuration not found for the specified group.")
    chat_model = get_chat_model(group_id, str(prompt_config.api_key))
    context = get_context(
        processed_summary,
        participant_processed_summary,
        str(prompt_config.prompt_chat),
        str(prompt_config.prompt_chat_with_participant),
    )
    history_ = [format_messages_for_completion(msg) for msg in reversed(history)]
    response = make_completion(chat_model, history_, context)
    return response


def get_chat_model(group_id: int, api_key: str) -> ChatOpenAI:
    """Retrieve a chat model for a specific group."""
    if group_id not in chat_models:
        chat_models[group_id] = ChatOpenAI(
            model_name="gpt-4-turbo",
            temperature=0.7,
            max_retries=2,
            timeout=30,
            api_key=api_key,
        )
    return chat_models[group_id]


def get_context(
    processed_summary: str,
    participant_processed_summary: Optional[str],
    prompt_chat: str,
    prompt_chat_with_participant: str,
) -> str:
    """Retrieve the context for a group and append the processed summary."""
    context = f"{prompt_chat}\n{processed_summary}"
    if participant_processed_summary:
        context += f"\n{prompt_chat_with_participant}\n{participant_processed_summary}"
    return context


def format_messages_for_completion(msg: Message) -> dict:
    """Format a Message instance to dictionary format for completion."""
    return dict(role=msg.message_type, content=msg.content)


def make_completion(chat_model: ChatOpenAI, messages: List[dict], context: str) -> str:
    """Generate a completion response using ChatOpenAI."""
    messages_ = [SystemMessage(content=context)]
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content")
        if role == "user":
            messages_.append(HumanMessage(content=content))
        elif role == "assistant":
            messages_.append(AIMessage(content=content))
    response = chat_model.invoke(messages_)
    return response.content


def process_pdf(
    file: file_storage.FileStorage, upload_folder: str, group_id: int, session: Session
) -> Tuple[str, FileStorage, str]:
    """Process a PDF file by converting each page to an image and generating summaries."""
    # Retrieve the prompt for the group
    logging.info("Retrieving prompt configuration...")
    prompt_config = session.query(PromptConfig).filter_by(group_id=group_id).first()
    if not prompt_config:
        raise ValueError("Prompt configuration not found for the specified group.")

    vision_model = ChatOpenAI(
        model_name="gpt-4o-mini",
        temperature=0,
        max_retries=2,
        timeout=30,
        api_key=str(prompt_config.api_key),
    )
    summary_model = ChatOpenAI(
        model_name="gpt-4-turbo",
        temperature=0.7,
        max_retries=2,
        timeout=30,
        api_key=str(prompt_config.api_key),
    )

    original_filename, new_file_storage, file_path = save_file(
        file, upload_folder, session
    )

    # Convert PDF pages to images
    pages = convert_from_path(file_path, fmt="png")
    responses = []

    for i, page in enumerate(pages):
        logging.info(f"Processing page {i + 1} of {len(pages)}")

        # Convert each page to a base64-encoded image string
        buffer = io.BytesIO()
        page.save(buffer, format="png")
        content = base64.b64encode(buffer.getbuffer().tobytes()).decode("utf-8")

        # Generate completion for each image page
        response = call_gpt_vision(
            vision_model, str(prompt_config.prompt_gpt_vision), content
        )
        responses.append(response.content)
        buffer.close()

    # Combine responses into a summary
    logging.info("Getting summary response...")
    summary = call_summary_model(
        summary_model, str(prompt_config.prompt_summary_pdf), "\n".join(responses)
    ).content

    return original_filename, new_file_storage, summary


def save_file(
    file: file_storage.FileStorage, upload_folder: str, session: Session
) -> Tuple[str, FileStorage, str]:
    """Save a file to the server and database."""
    original_filename = secure_filename(file.filename)
    file_uuid = uuid.uuid4().hex
    file_path = os.path.join(upload_folder, f"{file_uuid}.pdf")
    file.save(file_path)
    new_file_storage = FileStorage(
        file_name=original_filename, file_url=file_path, uploaded_at=datetime.utcnow()
    )
    session.add(new_file_storage)
    session.commit()
    return original_filename, new_file_storage, file_path


def call_gpt_vision(vision_model: ChatOpenAI, prompt: str, content: str) -> BaseMessage:
    return vision_model.invoke(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{content}"},
                    },
                ]
            )
        ]
    )


def call_summary_model(
    summary_model: ChatOpenAI, prompt: str, content: str
) -> BaseMessage:
    return summary_model.invoke(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {"type": "text", "text": content},
                ]
            )
        ],
        response_format={"type": "json_object"},
    )
