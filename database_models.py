import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import (
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

if DB_TYPE == "mysql":
    DB_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
else:
    file_path = f"{os.path.abspath(os.getcwd())}/{DB_NAME}"
    DB_URI = f"sqlite:///{file_path}"

engine = create_engine(DB_URI, echo=True)
Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()


class User(Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    name = Column(String(80), nullable=False)
    password = Column(String(255), nullable=False)
    user_groups = relationship("UserGroup", back_populates="user")
    participants = relationship("Participant", back_populates="user")


class Group(Base):
    __tablename__ = "Groups"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    image = Column(String(255))
    user_groups = relationship("UserGroup", back_populates="group")
    participants = relationship("Participant", back_populates="group")


class Participant(Base):
    __tablename__ = "Participants"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("Groups.id"), nullable=False)
    name = Column(String(100), nullable=False)
    role_document = Column(Text, nullable=True)

    user = relationship("User", back_populates="participants")
    group = relationship("Group", back_populates="participants")


class UserGroup(Base):
    __tablename__ = "UserGroups"
    user_id = Column(Integer, ForeignKey("Users.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("Groups.id"), primary_key=True)

    user = relationship("User", back_populates="user_groups")
    group = relationship("Group", back_populates="user_groups")


class Message(Base):
    __tablename__ = "messages"
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
