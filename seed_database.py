import bcrypt

from database_models import (
    Base,
    Group,
    GroupPersona,
    Persona,
    User,
    UserGroup,
    engine,
    session,
)

# Test data
user_data = [
    {"id": 1, "username": "test1", "name": "Gut", "password": "password123"},
    {"id": 2, "username": "test2", "name": "Jane", "password": "mypassword"},
]

groups_data = [
    {
        "id": 1,
        "name": "DISC Coach",
        "image": "/disc.png",
        "participants": [
            {
                "id": 2,
                "name": "Lauren",
                "description": "38, third grade teacher. Lives in Chicago by herself. Owns a car.",
                "image": "/lauren.png",
                "first_message": "Hi, I'm Lauren. Ask me anything!",
            },
            {
                "id": 3,
                "name": "Donnie",
                "description": "40, data analyst from Atlanta. Married, 2 kids, owns 2 cars.",
                "image": "/donnie.png",
                "first_message": "Hi, I'm Donnie. Ask me anything!",
            },
            {
                "id": 4,
                "name": "Jamal",
                "description": "20, retail sales associate at Home Depot. Lives in New Jersey with his parents and his sister. Owns a car.",
                "image": "/jamal.png",
                "first_message": "Hi, I'm Jamal. Ask me anything!",
            },
        ],
    },
    {
        "id": 2,
        "name": "HPTI Coach",
        "image": "/hpti.png",
        "participants": [
            {
                "id": 1,
                "name": "Shonda",
                "description": "27, hair salon assistant. Lives in Long Island with her son, Marshall (3). Considering buying a car.",
                "image": "/shonda.png",
                "first_message": "Hi, I'm Shonda. Ask me anything!",
            },
            {
                "id": 2,
                "name": "Lauren",
                "description": "38, third grade teacher. Lives in Chicago by herself. Owns a car.",
                "image": "/lauren.png",
                "first_message": "Hi, I'm Lauren. Ask me anything!",
            },
        ],
    },
]


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def populate_tables():
    for user in user_data:
        hashed_password = hash_password(user["password"])
        new_user = User(
            id=user["id"],
            username=user["username"],
            name=user["name"],
            password=hashed_password,
        )
        session.add(new_user)

    for group in groups_data:
        new_group = Group(id=group["id"], name=group["name"], image=group["image"])
        session.add(new_group)

        for participant in group["participants"]:
            existing_persona = (
                session.query(Persona).filter_by(id=participant["id"]).first()
            )
            if not existing_persona:
                new_persona = Persona(
                    id=participant["id"],
                    name=participant["name"],
                    description=participant["description"],
                    image=participant["image"],
                    first_message=participant["first_message"],
                )
                session.add(new_persona)

            group_persona = GroupPersona(
                group_id=group["id"], persona_id=participant["id"]
            )
            session.add(group_persona)

    session.add(UserGroup(user_id=1, group_id=1))  # Gut -> Mac Donals
    session.add(UserGroup(user_id=1, group_id=2))  # Gut -> Coca Cola
    session.add(UserGroup(user_id=2, group_id=2))  # Jane -> Coca Cola

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
