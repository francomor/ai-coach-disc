import base64
import io
import os
import uuid
from datetime import datetime
from typing import List, Tuple

from langchain.schema import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pdf2image import convert_from_path
from sqlalchemy.orm import Session
from werkzeug.datastructures import file_storage
from werkzeug.utils import secure_filename

from .database_models import FileStorage, Message, PromptConfig

# Initialize the ChatOpenAI model. Test gpt-4-turbo and gpt-4o-mini models
chat = ChatOpenAI(model_name="gpt-4-turbo", temperature=0.7, max_retries=2, timeout=30)
vision_model = ChatOpenAI(
    model_name="gpt-4o-mini", temperature=0, max_retries=2, timeout=30
)


def predict(
    history: List[Message], group_id: int, processed_summary: str, session: Session
) -> str:
    """Generate a prediction for chat history with group-specific context."""
    context = get_context(group_id, processed_summary, session)
    print(f"Context: {context}")
    history_ = [format_messages_for_completion(msg) for msg in reversed(history)]

    for msg in history:
        print(f"Message: {msg.content}")
    response = make_completion(history_, context)
    return response


def get_context(group_id: int, processed_summary: str, session: Session) -> str:
    """Retrieve the context for a group and append the processed summary."""
    prompt_config = session.query(PromptConfig).filter_by(group_id=group_id).first()
    if prompt_config:
        return f"{prompt_config.prompt_chat}\n{processed_summary}"
    else:
        raise ValueError("Prompt configuration not found for the specified group.")


def format_messages_for_completion(msg: Message) -> dict:
    """Format a Message instance to dictionary format for completion."""
    return dict(role=msg.message_type, content=msg.content)


def make_completion(messages: List[dict], context: str) -> str:
    """Generate a completion response using ChatOpenAI."""
    messages_ = [SystemMessage(content=context)]
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content")
        if role == "user":
            messages_.append(HumanMessage(content=content))
        elif role == "assistant":
            messages_.append(AIMessage(content=content))
    response = chat.invoke(messages_)
    print(f"Response: {response}")
    return response.content


def process_pdf(
    file: file_storage.FileStorage, upload_folder: str, group_id: int, session: Session
) -> Tuple[str, FileStorage, str]:
    """Process a PDF file by converting each page to an image and generating summaries."""
    # Retrieve the prompt for the group
    print("Retrieving prompt configuration...")
    prompt_config = session.query(PromptConfig).filter_by(group_id=group_id).first()
    if not prompt_config:
        raise ValueError("Prompt configuration not found for the specified group.")

    original_filename, new_file_storage, file_path = save_file(
        file, upload_folder, session
    )

    # Convert PDF pages to images
    pages = convert_from_path(file_path, fmt="png")
    responses = []

    for i, page in enumerate(pages):
        print(f"Processing page {i + 1} of {len(pages)}")

        # Convert each page to a base64-encoded image string
        buffer = io.BytesIO()
        page.save(buffer, format="png")
        content = base64.b64encode(buffer.getbuffer().tobytes()).decode("utf-8")

        # Generate completion for each image page
        response = call_gpt_vision(str(prompt_config.prompt_gpt_vision), content)
        responses.append(response.content)
        buffer.close()

    # Combine responses into a summary
    print("Getting summary response...")
    summary = call_summary_model(
        str(prompt_config.prompt_summary_pdf), "\n".join(responses)
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


def call_gpt_vision(prompt: str, content: str) -> BaseMessage:
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


def call_summary_model(prompt: str, content: str) -> BaseMessage:
    return chat.invoke(
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
