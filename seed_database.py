import bcrypt

from database_models import Base, Group, Participant, User, UserGroup, engine, session

# Test data
user_data = [
    {"id": 1, "username": "test1", "name": "Franco Morero", "password": "password123"},
    {"id": 2, "username": "test2", "name": "Pablo Marek", "password": "mypassword"},
]

groups_data = [
    {"id": 1, "name": "DISC Coach", "image": "/disc.png"},
    {"id": 2, "name": "HPTI Coach", "image": "/hpti.png"},
]

participants_data = [
    {
        "id": 1,
        "user_id": 1,
        "group_id": 1,
        "name": "Lauren",
        "role_document": "DISC Coach-specific document for Lauren",
    },
    {
        "id": 2,
        "user_id": 1,
        "group_id": 1,
        "name": "Donnie",
        "role_document": "DISC Coach-specific document for Donnie",
    },
    {
        "id": 3,
        "user_id": 2,
        "group_id": 1,
        "name": "Jamal",
        "role_document": "DISC Coach-specific document for Jamal",
    },
    {
        "id": 4,
        "user_id": 1,
        "group_id": 2,
        "name": "Shonda",
        "role_document": "HPTI Coach-specific document for Shonda",
    },
    {
        "id": 5,
        "user_id": 1,
        "group_id": 2,
        "name": "Lauren",
        "role_document": "HPTI Coach-specific document for Lauren",
    },
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
        )
        session.add(new_user)

    # Add groups
    for group in groups_data:
        new_group = Group(id=group["id"], name=group["name"], image=group["image"])
        session.add(new_group)

    # Add participants
    for participant_data in participants_data:
        new_participant = Participant(
            id=participant_data["id"],
            user_id=participant_data["user_id"],
            group_id=participant_data["group_id"],
            name=participant_data["name"],
            role_document=participant_data["role_document"],
        )
        session.add(new_participant)

    # Map users to groups
    session.add(UserGroup(user_id=1, group_id=1))  # Gut -> DISC Coach
    session.add(UserGroup(user_id=1, group_id=2))  # Gut -> HPTI Coach
    session.add(UserGroup(user_id=2, group_id=2))  # Jane -> HPTI Coach

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
