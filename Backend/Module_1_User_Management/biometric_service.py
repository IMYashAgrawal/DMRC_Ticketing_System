from deepface import DeepFace
import numpy as np

# Using ArcFace model (~35MB) — lighter and faster to download than Facenet (92MB)
# ArcFace threshold: cosine distance < 0.68 is a match
MODEL_NAME = "ArcFace"
THRESHOLD  = 0.68   # cosine distance threshold for ArcFace

class BiometricService:
    @staticmethod
    def get_embedding(image_b64: str):
        """Extracts face embedding from image using DeepFace (ArcFace model)."""
        if not image_b64.startswith("data:image"):
            image_b64 = "data:image/jpeg;base64," + image_b64

        try:
            result = DeepFace.represent(
                img_path=image_b64,
                model_name=MODEL_NAME,
                enforce_detection=False
            )
            if len(result) > 0:
                return result[0]["embedding"]
            return None
        except Exception as e:
            print(f"[BiometricService] Embedding error: {e}")
            return None

    @staticmethod
    def verify_embedding(stored_embedding: list, live_image_b64: str, threshold: float = THRESHOLD) -> bool:
        """
        Compare a live face image against a stored embedding.
        Uses cosine similarity (ArcFace is optimised for cosine distance).
        """
        live_emb = BiometricService.get_embedding(live_image_b64)
        if live_emb is None:
            return False

        a = np.array(stored_embedding)
        b = np.array(live_emb)

        # Cosine distance: 0 = identical, 1 = completely different
        cosine_dist = 1 - np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10)
        print(f"[BiometricService] Cosine distance: {cosine_dist:.4f} (threshold: {threshold})")
        return cosine_dist < threshold

biometric_service = BiometricService()
