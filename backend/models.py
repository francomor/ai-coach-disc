import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

load_dotenv()

DB_TYPE = os.getenv("DB_TYPE", "sqlite")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "")
DB_NAME = os.getenv("DB_NAME", "file.db")

if DB_TYPE == "postgres":
    DB_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
else:
    file_path = f"{os.path.abspath(os.getcwd())}/{DB_NAME}"
    DB_URI = f"sqlite:///{file_path}"

engine = create_engine(DB_URI, echo=True)
Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()


class Question(Base):
    __tablename__ = "Questions"
    id = Column(Integer, primary_key=True)
    text = Column(String(255), nullable=False)


class OnboardingAnswer(Base):
    __tablename__ = "OnboardingAnswers"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("Questions.id"), nullable=False)
    answer = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="onboarding_answers")
    question = relationship("Question")


class User(Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    name = Column(String(80), nullable=False)
    password = Column(String(255), nullable=False)
    onboarding_complete = Column(Boolean, default=False)
    enabled = Column(Boolean, default=True)

    # Relationships
    user_groups = relationship("UserGroup", back_populates="user")
    participants = relationship("Participant", back_populates="user")
    onboarding_answers = relationship("OnboardingAnswer", back_populates="user")


class PromptConfig(Base):
    __tablename__ = "PromptConfigs"
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("Groups.id"), nullable=False)
    api_key = Column(String(255), nullable=False)
    prompt_chat = Column(Text, nullable=False)
    prompt_chat_with_participant = Column(Text, nullable=False)
    prompt_gpt_vision = Column(Text, nullable=False)
    prompt_summary_pdf = Column(Text, nullable=False)

    # Relationships
    group = relationship("Group", back_populates="prompt_configs")


class Group(Base):
    __tablename__ = "Groups"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    url_slug = Column(String(50), nullable=False)
    image = Column(String(255))

    # Relationships
    user_groups = relationship("UserGroup", back_populates="group")
    participants = relationship("Participant", back_populates="group")
    prompt_configs = relationship("PromptConfig", back_populates="group")


class FileStorage(Base):
    __tablename__ = "FileStorage"
    id = Column(Integer, primary_key=True)
    file_name = Column(String(255), nullable=False)  # Store the original file name
    file_url = Column(String(255), nullable=False)  # Store the file path with UUID
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user_group_files = relationship("UserGroupFile", back_populates="file_storage")
    participant_files = relationship("ParticipantFile", back_populates="file_storage")


class ParticipantFile(Base):
    __tablename__ = "ParticipantFiles"
    id = Column(Integer, primary_key=True)
    participant_id = Column(Integer, ForeignKey("Participants.id"), nullable=False)
    file_storage_id = Column(Integer, ForeignKey("FileStorage.id"), nullable=False)
    processed_summary = Column(Text, nullable=True)

    # Relationships
    participant = relationship("Participant", back_populates="files")
    file_storage = relationship("FileStorage", back_populates="participant_files")


class Participant(Base):
    __tablename__ = "Participants"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("Groups.id"), nullable=False)
    name = Column(String(100), nullable=False)

    # Relationships
    user = relationship("User", back_populates="participants")
    group = relationship("Group", back_populates="participants")
    files = relationship("ParticipantFile", back_populates="participant")


class UserGroupFile(Base):
    __tablename__ = "UserGroupFiles"
    id = Column(Integer, primary_key=True)
    user_group_id = Column(Integer, ForeignKey("UserGroups.group_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    file_storage_id = Column(Integer, ForeignKey("FileStorage.id"), nullable=False)
    processed_summary = Column(Text, nullable=True)

    # Relationships
    user_group = relationship("UserGroup", back_populates="files")
    file_storage = relationship("FileStorage", back_populates="user_group_files")


class UserGroup(Base):
    __tablename__ = "UserGroups"
    user_id = Column(Integer, ForeignKey("Users.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("Groups.id"), primary_key=True)

    # Relationships
    user = relationship("User", back_populates="user_groups")
    group = relationship("Group", back_populates="user_groups")
    files = relationship(
        "UserGroupFile",
        back_populates="user_group",
        cascade="all, delete-orphan",
        foreign_keys="[UserGroupFile.user_id, UserGroupFile.user_group_id]",
    )


class Message(Base):
    __tablename__ = "Messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("Users.id"))
    group_id = Column(Integer, ForeignKey("Groups.id"))
    message_type = Column(String(100), nullable=False)  # user, assistant, system
    participant_id = Column(Integer, ForeignKey("Participants.id"), nullable=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    group = relationship("Group")
    participant = relationship("Participant")

    def __init__(self, user_id, group_id, message_type, content, participant_id=None):
        self.user_id = user_id
        self.group_id = group_id
        self.participant_id = participant_id
        self.message_type = message_type
        self.content = content
