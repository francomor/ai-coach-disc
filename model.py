import os
import random
import time
from typing import List

from langchain.chat_models import ChatOpenAI
from langchain.schema import AIMessage, HumanMessage, SystemMessage

from database_models import Message
from excuses import excuses

chat = ChatOpenAI(model_name="gpt-4", temperature=0.7)


def retry(max_retries, wait_time):
    def decorator(func):
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception:
                    retries += 1
                    time.sleep(wait_time)
            excuses = kwargs.get("excuses", [])
            response = (
                random.choice(excuses) if excuses else "Sorry, something went wrong."
            )
            return response

        return wrapper

    return decorator


def get_context(ai_persona):
    absolute_path = os.path.dirname(__file__)
    fn = os.path.join(absolute_path, f"data/{ai_persona.lower()}.txt")
    with open(fn, "r") as fp:
        data = fp.read()
    return data


@retry(max_retries=5, wait_time=60)
def make_completion(messages, context, excuses=None):
    messages_ = [SystemMessage(content=context)]
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content")
        if role == "user":
            messages_.append(HumanMessage(content=content))
        elif role == "assistant":
            messages_.append(AIMessage(content=content))
    # response = chat(messages_)
    # return response.content
    return "I'm sorry, I'm not able to respond at the moment."


def f2p(msg: Message) -> dict:
    return dict(role=msg.message_type, content=msg.content)


def predict(history: List[Message], ai_persona: str):
    context = get_context(ai_persona)
    history_ = [f2p(msg) for msg in history]
    excuses_ = excuses.get(ai_persona.lower(), [])
    response = make_completion(history_, context, excuses=excuses_)
    return response
