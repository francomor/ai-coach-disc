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
from sqlalchemy.schema import ForeignKeyConstraint

load_dotenv()

DB_TYPE = os.getenv("DB_TYPE", "sqlite")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "")
DB_NAME = os.getenv("DB_NAME", "file.db")

if DB_TYPE == "mysql":
    DB_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
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

    user = relationship("User", back_populates="onboarding_answers")
    question = relationship("Question")


class User(Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    name = Column(String(80), nullable=False)
    password = Column(String(255), nullable=False)
    onboarding_complete = Column(Boolean, default=False)
    user_groups = relationship("UserGroup", back_populates="user")
    participants = relationship("Participant", back_populates="user")
    onboarding_answers = relationship("OnboardingAnswer", back_populates="user")


class Group(Base):
    __tablename__ = "Groups"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    url_slug = Column(String(50), nullable=False)
    image = Column(String(255))
    user_groups = relationship("UserGroup", back_populates="group")
    participants = relationship("Participant", back_populates="group")


class Participant(Base):
    __tablename__ = "Participants"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("Groups.id"), nullable=False)
    name = Column(String(100), nullable=False)

    user = relationship("User", back_populates="participants")
    group = relationship("Group", back_populates="participants")


class UserGroupFile(Base):
    __tablename__ = "UserGroupFiles"
    id = Column(Integer, primary_key=True)
    user_group_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    file_name = Column(String(255), nullable=False)  # Store the original file name
    file_url = Column(String(255), nullable=False)  # Store the file path with UUID
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        ForeignKeyConstraint(
            ["user_group_id", "user_id"],
            ["UserGroups.group_id", "UserGroups.user_id"],
        ),
    )

    user_group = relationship(
        "UserGroup",
        back_populates="files",
        primaryjoin="and_(UserGroupFile.user_group_id == UserGroup.group_id, "
        "UserGroupFile.user_id == UserGroup.user_id)",
    )


class UserGroup(Base):
    __tablename__ = "UserGroups"
    user_id = Column(Integer, ForeignKey("Users.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("Groups.id"), primary_key=True)

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

    user = relationship("User")
    group = relationship("Group")
    participant = relationship("Participant")

    def __init__(self, user_id, group_id, message_type, content, participant_id=None):
        self.user_id = user_id
        self.group_id = group_id
        self.participant_id = participant_id
        self.message_type = message_type
        self.content = content
