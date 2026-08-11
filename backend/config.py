from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    llm_base_url: str = "https://router.huggingface.co/v1"
    llm_model: str = "meta-llama/Llama-3.3-70B-Instruct"
    llm_api_key: str = ""
    tavily_api_key: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
