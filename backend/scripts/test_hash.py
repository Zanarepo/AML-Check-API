import hmac
import hashlib

secret = "a9e0ea170c6563106ec5b5e5bf868811a94a5b5ecf25220b25722dc9fc44b3b9"
# I'll try to find a key that corresponds to the hash in the DB if possible, 
# but I don't know the raw keys.

# Let's check if the secret itself is a hex string and if we should decode it?
# In security.py: secret_bytes = settings.API_AUTH_SECRET.encode('utf-8')
# It encodes the hex string as utf-8, it doesn't decode the hex!

def get_hash(key, secret):
    return hmac.new(secret.encode('utf-8'), key.encode('utf-8'), hashlib.sha256).hexdigest()

print(f"Hash of 'test': {get_hash('test', secret)}")
