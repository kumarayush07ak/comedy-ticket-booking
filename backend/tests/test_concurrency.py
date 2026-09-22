import concurrent.futures
import uuid

import requests


BASE_URL = "http://127.0.0.1:8000"

EVENT_ID = 1
SEAT_IDS = [3, 4]
CUSTOMER_COUNT = 20


def create_customer(index: int) -> tuple[str, str]:
    email = f"concurrency_{index}_{uuid.uuid4().hex[:8]}@example.com"

    payload = {
        "name": f"Concurrency Customer {index}",
        "email": email,
        "password": "TestPassword123!",
    }

    response = requests.post(
        f"{BASE_URL}/auth/register",
        json=payload,
        timeout=10,
    )

    response.raise_for_status()

    return email, "TestPassword123!"


def login_customer(credentials: tuple[str, str]) -> str:
    email, password = credentials

    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": email,
            "password": password,
        },
        timeout=10,
    )

    response.raise_for_status()

    return response.json()["access_token"]


def reserve_seats(token: str) -> dict:
    response = requests.post(
        f"{BASE_URL}/reservations/hold",
        json={
            "event_id": EVENT_ID,
            "seat_ids": SEAT_IDS,
        },
        headers={
            "Authorization": f"Bearer {token}",
        },
        timeout=15,
    )

    return {
        "status_code": response.status_code,
        "body": response.json(),
    }


def main() -> None:
    print("=" * 60)
    print("CONCURRENCY TEST")
    print("=" * 60)
    print(f"Event ID : {EVENT_ID}")
    print(f"Seat IDs  : {SEAT_IDS}")
    print(f"Customers: {CUSTOMER_COUNT}")
    print()

    print("Creating temporary customers...")

    credentials = []

    for index in range(1, CUSTOMER_COUNT + 1):
        try:
            customer = create_customer(index)
            credentials.append(customer)
            print(f"Customer {index:02d}: created")
        except Exception as exc:
            print(f"Customer {index:02d}: FAILED - {exc}")

    print()
    print(f"Created customers: {len(credentials)}")

    if len(credentials) != CUSTOMER_COUNT:
        print("ERROR: Could not create all test customers.")
        return

    print()
    print("Logging in customers...")

    tokens = []

    for index, customer in enumerate(credentials, start=1):
        try:
            token = login_customer(customer)
            tokens.append(token)
            print(f"Customer {index:02d}: logged in")
        except Exception as exc:
            print(f"Customer {index:02d}: LOGIN FAILED - {exc}")

    print()
    print(f"Logged-in customers: {len(tokens)}")

    if len(tokens) != CUSTOMER_COUNT:
        print("ERROR: Could not log in all test customers.")
        return

    print()
    print("Sending 20 reservation requests simultaneously...")
    print()

    with concurrent.futures.ThreadPoolExecutor(
        max_workers=CUSTOMER_COUNT
    ) as executor:
        futures = [
            executor.submit(reserve_seats, token)
            for token in tokens
        ]

        results = [
            future.result()
            for future in futures
        ]

    successful = [
        result
        for result in results
        if result["status_code"] in (200, 201)
    ]

    failed = [
        result
        for result in results
        if result["status_code"] not in (200, 201)
    ]

    print("=" * 60)
    print("RESULT")
    print("=" * 60)

    print(f"Total requests : {len(results)}")
    print(f"Successful     : {len(successful)}")
    print(f"Failed         : {len(failed)}")
    print()

    print("HTTP status codes:")

    status_counts = {}

    for result in results:
        status = result["status_code"]
        status_counts[status] = status_counts.get(status, 0) + 1

    for status, count in sorted(status_counts.items()):
        print(f"  {status}: {count}")

    print()

    if successful:
        print("Successful reservation:")
        print(successful[0]["body"])
        print()

    print("Failed reservation responses:")

    for result in failed:
        print(
            f"  HTTP {result['status_code']}: "
            f"{result['body']}"
        )

    print()

    if len(successful) == 1:
        print("PASS: Exactly one customer reserved the seat.")
    elif len(successful) == 0:
        print("FAIL: No customer successfully reserved the seat.")
    else:
        print(
            "FAIL: More than one customer successfully "
            "reserved the same seat."
        )


if __name__ == "__main__":
    main()