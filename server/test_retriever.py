from dotenv import load_dotenv
import os

from langchain_community.vectorstores import redis
from langchain_openai import OpenAIEmbeddings

load_dotenv(override=True)
question = "cual es mi disc"
retriever = redis.Redis.from_existing_index(
        OpenAIEmbeddings(model="text-embedding-3-large"),
        index_name=os.getenv('INDEX_NAME'),
        redis_url=os.getenv('REDIS_URL'),
        schema=os.getenv("SCHEMA")
).as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold":0.3, "k": 5}
)

rag_context = retriever.invoke(question)
relevant_chunks = "\n".join([doc.page_content for doc in rag_context])
print(relevant_chunks)
