import click
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from backend.models import (
    FileStorage,
    Group,
    Message,
    Participant,
    ParticipantFile,
    PromptConfig,
    User,
    UserGroup,
    UserGroupFile,
    engine,
)

Session = sessionmaker(bind=engine)
session = Session()
load_dotenv()


@click.group()
def admin():
    """Database Administration Tool"""


@admin.command()
@click.argument("username")
@click.argument("name")
@click.argument("password")
@click.option(
    "--onboarding_complete",
    default=False,
    is_flag=True,
    help="Mark onboarding as complete for the new user",
)
@click.option(
    "--enabled",
    default=True,
    type=bool,
    help="Enable or disable the user account (default is enabled)",
)
def add_user(username, name, password, onboarding_complete, enabled):
    """Add a new user"""
    try:
        new_user = User(
            username=username,
            name=name,
            password=password,
            onboarding_complete=onboarding_complete,
            enabled=enabled,
        )
        session.add(new_user)
        session.commit()
        click.echo(f"User {username} added.")
    except SQLAlchemyError as e:
        session.rollback()
        click.echo(f"Error adding user: {e}", err=True)


@admin.command()
def list_users():
    """List all users"""
    try:
        users = session.query(User).all()
        for user in users:
            click.echo(f"ID: {user.id}, Username: {user.username}, Name: {user.name}")
    except SQLAlchemyError as e:
        click.echo(f"Error retrieving users: {e}", err=True)


@admin.command()
@click.argument("username")
def disable_user(username):
    """Disable a user by username"""
    try:
        user = session.query(User).filter_by(username=username).first()
        if user:
            user.enabled = False
            session.commit()
            click.echo(f"User {username} disabled.")
        else:
            click.echo("User not found.")
    except SQLAlchemyError as e:
        session.rollback()
        click.echo(f"Error disabling user: {e}", err=True)


@admin.command()
@click.argument("username")
def enable_user(username):
    """Enable a user by username"""
    try:
        user = session.query(User).filter_by(username=username).first()
        if user:
            user.enabled = True
            session.commit()
            click.echo(f"User {username} enabled.")
        else:
            click.echo("User not found.")
    except SQLAlchemyError as e:
        session.rollback()
        click.echo(f"Error enabling user: {e}", err=True)


@admin.command()
@click.argument("group_name")
@click.argument("prompt_chat")
@click.argument("prompt_gpt_vision")
@click.argument("prompt_summary_pdf")
def change_prompt_config(
    group_name, prompt_chat, prompt_gpt_vision, prompt_summary_pdf
):
    """Change prompt configs for a group by group name"""
    try:
        group = session.query(Group).filter_by(name=group_name).first()
        if group:
            prompt_config = (
                session.query(PromptConfig).filter_by(group_id=group.id).first()
            )
            if prompt_config:
                prompt_config.prompt_chat = prompt_chat
                prompt_config.prompt_gpt_vision = prompt_gpt_vision
                prompt_config.prompt_summary_pdf = prompt_summary_pdf
                session.commit()
                click.echo(f"Prompt config for group {group_name} updated.")
            else:
                click.echo("Prompt config not found.")
        else:
            click.echo("Group not found.")
    except SQLAlchemyError as e:
        session.rollback()
        click.echo(f"Error updating prompt config: {e}", err=True)


@admin.command()
def list_file_storage():
    """List all file storage entries"""
    try:
        files = session.query(FileStorage).all()
        for file in files:
            click.echo(
                f"ID: {file.id}, File Name: {file.file_name}, URL: {file.file_url}, Uploaded At: {file.uploaded_at}"
            )
    except SQLAlchemyError as e:
        click.echo(f"Error retrieving files: {e}", err=True)


@admin.command()
def list_participants():
    """List all participants"""
    try:
        participants = session.query(Participant).all()
        for participant in participants:
            click.echo(f"ID: {participant.id}, Name: {participant.name}")
    except SQLAlchemyError as e:
        click.echo(f"Error retrieving participants: {e}", err=True)


@admin.command()
@click.argument("participant_id")
def list_participant_files(participant_id):
    """List files for a specific participant by participant ID"""
    try:
        files = (
            session.query(ParticipantFile)
            .filter_by(participant_id=participant_id)
            .all()
        )
        for file in files:
            click.echo(f"ID: {file.id}, File Storage ID: {file.file_storage_id}")
    except SQLAlchemyError as e:
        click.echo(f"Error retrieving participant files: {e}", err=True)


@admin.command()
def list_user_group_files():
    """List all user group files"""
    try:
        files = session.query(UserGroupFile).all()
        for file in files:
            click.echo(
                f"ID: {file.id}, User ID: {file.user_id}, File Storage ID: {file.file_storage_id}"
            )
    except SQLAlchemyError as e:
        click.echo(f"Error retrieving user group files: {e}", err=True)


@admin.command()
def list_messages():
    """List all messages"""
    try:
        messages = session.query(Message).all()
        for message in messages:
            click.echo(
                f"ID: {message.id}, User ID: {message.user_id}, Group ID: {message.group_id}, Content: {message.content}"
            )
    except SQLAlchemyError as e:
        click.echo(f"Error retrieving messages: {e}", err=True)


@admin.command()
@click.argument("participant_id", type=int)
def remove_participant(participant_id):
    """Remove a participant by ID"""
    try:
        participant = session.query(Participant).get(participant_id)
        if participant:
            session.delete(participant)
            session.commit()
            click.echo(f"Participant {participant_id} removed.")
        else:
            click.echo("Participant not found.")
    except SQLAlchemyError as e:
        session.rollback()
        click.echo(f"Error removing participant: {e}", err=True)


@admin.command()
@click.argument("user_id", type=int)
@click.argument("group_id", type=int)
def add_participant(user_id, group_id):
    """Add a participant with a user ID and group ID"""
    try:
        new_participant = Participant(
            user_id=user_id, group_id=group_id, name="New Participant"
        )
        session.add(new_participant)
        session.commit()
        click.echo(f"Participant for User {user_id} and Group {group_id} added.")
    except SQLAlchemyError as e:
        session.rollback()
        click.echo(f"Error adding participant: {e}", err=True)


@admin.command()
@click.argument("user_id", type=int)
@click.argument("group_id", type=int)
def add_user_to_group(user_id, group_id):
    """Add a user to a group"""
    try:
        user_group = UserGroup(user_id=user_id, group_id=group_id)
        session.add(user_group)
        session.commit()
        click.echo(f"User {user_id} added to Group {group_id}.")
    except SQLAlchemyError as e:
        session.rollback()
        click.echo(f"Error adding user to group: {e}", err=True)


@admin.command()
@click.argument("user_id", type=int)
@click.argument("group_id", type=int)
def delete_user_from_group(user_id, group_id):
    """Delete a user from a group"""
    try:
        user_group = (
            session.query(UserGroup)
            .filter_by(user_id=user_id, group_id=group_id)
            .first()
        )
        if user_group:
            session.delete(user_group)
            session.commit()
            click.echo(f"User {user_id} removed from Group {group_id}.")
        else:
            click.echo("User-Group association not found.")
    except SQLAlchemyError as e:
        session.rollback()
        click.echo(f"Error removing user from group: {e}", err=True)


if __name__ == "__main__":
    admin()
