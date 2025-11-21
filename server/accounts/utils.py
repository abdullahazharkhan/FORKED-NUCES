import uuid

DICEBEAR_BASE = "https://api.dicebear.com/9.x"
DICEBEAR_STYLE = "dylan"

def generate_random_avatar_url() -> str:
    seed = uuid.uuid4().hex
    return f"{DICEBEAR_BASE}/{DICEBEAR_STYLE}/svg?seed={seed}"