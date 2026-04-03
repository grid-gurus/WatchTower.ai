import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import About from "../components/About"
import PricingCards from "../components/PricingCards"

export default function Home() {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <Hero />
      <About />
      <PricingCards />
    </div>
  )
}