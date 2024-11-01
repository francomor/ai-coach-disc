import glob
import os

from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, UnstructuredMarkdownLoader
from langchain_community.vectorstores import redis
from langchain_openai import OpenAIEmbeddings

BASE_FOLDER = "disc_data"


def load():
    load_dotenv(override=True)
    markdown_files = glob.glob(f"{BASE_FOLDER}/*.md")
    data = []
    for file in markdown_files:
        loader = UnstructuredMarkdownLoader(file)
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )
        md_data = loader.load_and_split(splitter)
        data.extend(md_data)

    pdf_files = glob.glob(f"{BASE_FOLDER}/*.pdf")
    for file in pdf_files:
        loader = PyPDFLoader(file)
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )
        pdf_data = loader.load_and_split(splitter)
        data.extend(pdf_data)

    print(f"Loaded {len(data)} documents")
    print("Writing to Redis...")
    rds = redis.Redis.from_documents(
        data,
        OpenAIEmbeddings(model="text-embedding-3-large"),
        index_name=os.getenv("INDEX_NAME"),
        key_prefix="doc",
        redis_url=os.getenv("REDIS_URL"),
    )
    rds.write_schema(os.getenv("SCHEMA"))


if __name__ == "__main__":
    load()
