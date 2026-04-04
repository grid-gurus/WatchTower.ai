import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import About from "../components/About"
import PricingCards from "../components/PricingCards"
import MinimalNavbar from "../components/MinimalNavbar"
import { useState, useEffect } from "react"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("access_token")));
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-changed", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-changed", syncAuthState);
    };
  }, []);
  return (
    <div className="relative bg-gradient-to-br from-black via-[#0a0a23] to-black text-white overflow-hidden">

      {/* Glow */}
      <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-400 opacity-25 blur-[200px] rounded-full"></div>
      <div className="absolute bottom-[-120px] right-[-120px] w-[500px] h-[500px] bg-pink-500 opacity-25 blur-[200px] rounded-full"></div>
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-purple-500 opacity-15 blur-[180px] rounded-full"></div>

      {/* CONTENT */}
      <div className="relative z-10">
        {isLoggedIn ? (
          // Show full navbar when logged in
          <>
            <Navbar />
            <Hero />
            <About />
            <PricingCards />
          </>
        ) : (
          // Show minimal navbar and hero content when not logged in
          <>
            <MinimalNavbar />
            <Hero />
          </>
        )}
      </div>
    </div>
  );
}
//           </>
//         )}
//       </div>

//     </div>
//   )
// }