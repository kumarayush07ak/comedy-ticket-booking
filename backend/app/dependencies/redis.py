from redis import Redis

from app.redis_client import redis_client


def get_redis() -> Redis:
    return redis_client