# generate_keys.py
import kyber_py
from kyber_py.ml_kem import ML_KEM_768
from kyber_py.kyber.kyber import Kyber
from dilithium_py.ml_dsa import ML_DSA_44

# Generate Kyber key pair
print()
k = Kyber(kyber_py.kyber.default_parameters.DEFAULT_PARAMETERS['kyber_768'])
kyber_public, kyber_private = k.keygen()

# Generate Dilithium key pair
dilithium_public, dilithium_private = ML_DSA_44.keygen()

# Save keys to files
with open('kyber_public.key', 'wb') as f:
    f.write(kyber_public)
with open('kyber_private.key', 'wb') as f:
    f.write(kyber_private)
with open('dilithium_public.key', 'wb') as f:
    f.write(dilithium_public)
with open('dilithium_private.key', 'wb') as f:
    f.write(dilithium_private)
