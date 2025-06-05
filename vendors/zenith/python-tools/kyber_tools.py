# test_encryption.py
from kyber_py.ml_kem import ML_KEM_768

# Load keys
with open('kyber_public.key', 'rb') as f:
    public_key = f.read()
with open('kyber_private.key', 'rb') as f:
    private_key = f.read()


# Encrypt
shared_secret_enc, ciphertext = ML_KEM_768.encaps(public_key)

# Decrypt
shared_secret_dec = ML_KEM_768.decaps(private_key, ciphertext)

assert shared_secret_enc == shared_secret_dec
print("Encryption and decryption successful.")
