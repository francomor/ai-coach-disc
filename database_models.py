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


class Group(Base):
    __tablename__ = "Groups"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    image = Column(String(255))
    user_groups = relationship("UserGroup", back_populates="group")
    group_personas = relationship("GroupPersona", back_populates="group")


class Persona(Base):
    __tablename__ = "Personas"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    image = Column(String(255))
    first_message = Column(String(255))


class UserGroup(Base):
    __tablename__ = "UserGroups"
    user_id = Column(Integer, ForeignKey("Users.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("Groups.id"), primary_key=True)

    user = relationship("User", back_populates="user_groups")
    group = relationship("Group", back_populates="user_groups")


class GroupPersona(Base):
    __tablename__ = "GroupPersonas"
    group_id = Column(Integer, ForeignKey("Groups.id"), primary_key=True)
    persona_id = Column(Integer, ForeignKey("Personas.id"), primary_key=True)

    group = relationship("Group", back_populates="group_personas")
    persona = relationship("Persona")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("Users.id"))
    group_id = Column(Integer, ForeignKey("Groups.id"))
    message_type = Column(String(100), nullable=False)  # user, assistant, system
    persona_id = Column(Integer, ForeignKey("Personas.id"), nullable=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    group = relationship("Group")
    persona = relationship("Persona")

    def __init__(self, user_id, group_id, message_type, content, persona_id=None):
        self.user_id = user_id
        self.group_id = group_id
        self.persona_id = persona_id
        self.message_type = message_type
        self.content = content
