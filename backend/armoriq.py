import os
import dotenv
from google import genai

class ArmorIQGuard:
    def __init__(self):
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        dotenv.load_dotenv(env_path)
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self.vlm_client = genai.Client(api_key=api_key)
            self.model_name = "gemini-2.5-flash"
             # Enforce deterministic results for policy checking
            self.config = {"temperature": 0.0}
        else:
            self.vlm_client = None

    def evaluate_request(self, query: str, context: str = "global") -> dict:
        """
        Acts as the WatchTower Supervisor Check. 
        Returns {"status": "allowed"} or {"status": "blocked", "message": "Why"}
        """
        print(f"🛡️ [ArmorIQ] Evaluating request: '{query}' in context: '{context}'")
        
        # =========================================================
        # 1. HARD BLOCK: Strict Privacy Zones
        # =========================================================
        restricted_zones = ["bathroom", "breakroom", "restroom", "locker", "private"]
        if context and any(zone in context.lower() for zone in restricted_zones):
             # Only lethal/weapon threats bypass privacy zone rules
             if "weapon" not in query.lower() and "gun" not in query.lower() and "knife" not in query.lower():
                 print("🛑 [ArmorIQ] BLOCKED: Privacy Zone Violation.")
                 return {
                     "status": "blocked", 
                     "message": "ArmorIQ Check Failed: Active surveillance tracking is strictly prohibited in designated employee privacy zones. Only active lethal threats can override this."
                 }

        # =========================================================
        # 2. AI POLICY GUARDRAIL: Anti-Profiling
        # =========================================================
        if not self.vlm_client:
             print("⚠️ [ArmorIQ] API Offline. Defaulting to allowed.")
             return {"status": "allowed"} 
             
        prompt = f"""
        You are the ArmorIQ Ethics & Policy Firewall for a CCTV Surveillance SaaS.
        Evaluate this camera search request: "{query}"

        Strict Boundaries:
        1. BLOCKED: Requests targeting people based solely on race, ethnicity, or explicit demographic profiling (e.g. 'Track the Asian guy').
        2. BLOCKED: Requests trying to identify minor children visuals for general tracking/marketing.
        3. BLOCKED: Requests containing sexual harassment, sexist/perverted intentions (e.g. "search for girls in short dresses"), religious hate, or explicitly racist language.
        4. ALLOWED: Tracking lethal/active threats (e.g. "guy with weapon", "man with gun").
        5. ALLOWED: Tracking criminal behavior like theft, shoplifting, or trespassing (e.g. "thief stealing bag", "suspicious masked individual").
        6. ALLOWED: Tracking generic, non-protected physical descriptors (e.g. "man in red shirt", "person running", "woman with blue bag").

        Provide your assessment strictly in the following format. 
        Line 1: Either 'ALLOWED' or 'BLOCKED'
        Line 2: A highly professional 1 sentence explanation as to why. Example: 'Request violates Anti-Profiling safety boundaries by targeting protected demographics.'
        """

        try:
            response = self.vlm_client.models.generate_content(
                model=self.model_name, 
                contents=[prompt],
                config=self.config
            )
            
            # Parse the response cleanly
            result_text = [line for line in response.text.strip().split('\n') if line.strip()]
            decision = result_text[0].upper()
            reason = result_text[1] if len(result_text) > 1 else "Protected by universal ethics guidelines."

            if "BLOCKED" in decision:
                print(f"🛑 [ArmorIQ] BLOCKED by AI: {reason}")
                return {"status": "blocked", "message": f"ArmorIQ Agent: {reason}"}
            
            print("✅ [ArmorIQ] Clear. Security action allowed.")
            return {"status": "allowed"}

        except Exception as e:
            print(f"⚠️ [ArmorIQ] System Error (API issue): {e}")
            return {"status": "allowed"}

# Instantiate the singleton supervisor for the app
armoriq_supervisor = ArmorIQGuard()
