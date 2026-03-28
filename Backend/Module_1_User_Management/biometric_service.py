from deepface import DeepFace
import numpy as np

class BiometricService:
    @staticmethod
    def get_embedding(image_b64: str):
        """ Extracts 128-dimensional face embedding from image using DeepFace (Facenet). """
        if not image_b64.startswith("data:image"):
            image_b64 = "data:image/jpeg;base64," + image_b64
            
        try:
            result = DeepFace.represent(img_path=image_b64, model_name="Facenet", enforce_detection=False)
            if len(result) > 0:
                embedding = result[0]["embedding"]
                return embedding
            return None
        except Exception as e:
            print(f"Facenet Embedding Extraction Error: {e}")
            return None

    @staticmethod
    def verify_embedding(stored_embedding: list, live_image_b64: str, threshold: float = 10.0) -> bool:
        """ 
        Compare a live image base64 against a stored 128-D embedding vector.
        Uses Euclidean L2 distance for Facenet model.
        """
        live_emb = BiometricService.get_embedding(live_image_b64)
        if not live_emb:
            return False
            
        # Calculate Euclidean distance
        a = np.array(stored_embedding)
        b = np.array(live_emb)
        distance = np.linalg.norm(a - b)
        
        print(f"Face Match Distance: {distance} (Threshold: {threshold})")
        return distance < threshold

biometric_service = BiometricService()
