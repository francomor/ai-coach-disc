from pathlib import Path

import bcrypt

from .database_models import (
    Base,
    Group,
    OnboardingAnswer,
    Participant,
    PromptConfig,
    Question,
    User,
    UserGroup,
    engine,
    session,
)

# Test data
user_data = [
    {
        "id": 1,
        "username": "test1",
        "name": "Franco Morero",
        "password": "password123",
        "onboarding_complete": True,
    },
    {
        "id": 2,
        "username": "test2",
        "name": "Pablo Marek",
        "password": "mypassword",
        "onboarding_complete": False,
    },
]

groups_data = [
    {"id": 1, "name": "DISC Coach", "url_slug": "disc-coach", "image": "/disc.png"},
    {"id": 2, "name": "HPTI Coach", "url_slug": "hpti-coach", "image": "/hpti.png"},
]

prompts_folder = Path("prompts")
disc_folder = prompts_folder / "disc"
hpti_folder = prompts_folder / "hpti"

prompts_configs_data = [
    {
        "id": 1,
        "group_id": 1,
        "prompt_chat": Path(disc_folder / "chat.txt").read_text(),
        "prompt_gpt_vision": Path(disc_folder / "gpt_vision.txt").read_text(),
        "prompt_summary_pdf": Path(disc_folder / "summary_pdf.txt").read_text(),
    },
    {
        "id": 2,
        "group_id": 2,
        "prompt_chat": "Prompt for chat",
        "prompt_gpt_vision": "Prompt for GPT Vision",
        "prompt_summary_pdf": "Prompt for PDF summary",
    },
]

participants_data = [
    {
        "id": 1,
        "user_id": 1,
        "group_id": 1,
        "name": "Lauren",
    },
    {
        "id": 2,
        "user_id": 1,
        "group_id": 1,
        "name": "Donnie",
    },
    {
        "id": 3,
        "user_id": 2,
        "group_id": 1,
        "name": "Jamal",
    },
    {
        "id": 4,
        "user_id": 1,
        "group_id": 2,
        "name": "Shonda",
    },
    {
        "id": 5,
        "user_id": 1,
        "group_id": 2,
        "name": "Lauren",
    },
]

# Questions data
questions_data = [
    {
        "id": 1,
        "text": "¿Cuál es tu rol actual y cuáles son tus funciones y responsabilidades principales?",
    },
    {
        "id": 2,
        "text": "¿Cuáles son los principales desafíos/problematicas que enfrentas en tu día a día laboral?",
    },
    {"id": 3, "text": "¿Tienes metas específicas a corto y mediano plazo?"},
    {
        "id": 4,
        "text": "¿En qué tipo de empresa trabajas y a qué sector pertenece (e.g., tecnología, servicios, manufactura)?",
    },
    {
        "id": 5,
        "text": "¿Que edad tenés, cuántos años llevas en tu cargo actual y en la empresa?",
    },
    {"id": 6, "text": "¿Tienes personas a tu cargo o gestionas equipos?"},
]

# Answers data for test1
answers_data = [
    {
        "question_id": 1,
        "answer": "Soy gerente de proyectos, responsable de coordinar equipos.",
    },
    {"question_id": 2, "answer": "Desafíos en la gestión del tiempo y la delegación."},
    {"question_id": 3, "answer": "Lograr un ascenso en el próximo año."},
    {
        "question_id": 4,
        "answer": "Trabajo en una empresa de tecnología, específicamente en desarrollo de software.",
    },
    {
        "question_id": 5,
        "answer": "Tengo 35 años, con 5 años en mi cargo actual y 10 años en la empresa.",
    },
    {"question_id": 6, "answer": "Sí, gestiono un equipo de 5 personas."},
]


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def populate_tables():
    # Add users
    for user in user_data:
        hashed_password = hash_password(user["password"])
        new_user = User(
            id=user["id"],
            username=user["username"],
            name=user["name"],
            password=hashed_password,
            onboarding_complete=user["onboarding_complete"],
        )
        session.add(new_user)

    # Add groups
    for group in groups_data:
        new_group = Group(
            id=group["id"],
            name=group["name"],
            url_slug=group["url_slug"],
            image=group["image"],
        )
        session.add(new_group)

    # Add prompt configurations
    for prompt_config in prompts_configs_data:
        new_prompt_config = PromptConfig(
            id=prompt_config["id"],
            group_id=prompt_config["group_id"],
            prompt_chat=prompt_config["prompt_chat"],
            prompt_gpt_vision=prompt_config["prompt_gpt_vision"],
            prompt_summary_pdf=prompt_config["prompt_summary_pdf"],
        )
        session.add(new_prompt_config)

    # Add participants
    for participant_data in participants_data:
        new_participant = Participant(
            id=participant_data["id"],
            user_id=participant_data["user_id"],
            group_id=participant_data["group_id"],
            name=participant_data["name"],
        )
        session.add(new_participant)

    # Add questions
    for question in questions_data:
        new_question = Question(id=question["id"], text=question["text"])
        session.add(new_question)

    # Add answers for test1 (user_id = 1)
    for answer_data in answers_data:
        new_answer = OnboardingAnswer(
            user_id=1,
            question_id=answer_data["question_id"],
            answer=answer_data["answer"],
        )
        session.add(new_answer)

    # Map users to groups
    session.add(UserGroup(user_id=1, group_id=1))  # Franco -> DISC Coach
    session.add(UserGroup(user_id=1, group_id=2))  # Franco -> HPTI Coach
    session.add(UserGroup(user_id=2, group_id=2))  # Pablo -> HPTI Coach

    session.commit()


def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def main():
    reset_database()
    populate_tables()
    session.close()


if __name__ == "__main__":
    main()
