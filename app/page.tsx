import React from 'react'
import CompanionCard from "@/components/CompanionCard";
import CompanionsList from "@/components/CompanionsList";
import CTA from "@/components/CTA";
import {recentSessions} from "@/constants";

const Page = () => {
  return (
    <main>
        <h1>
            Popular Companions
        </h1>
        <section className="home-section">
            <CompanionCard
                id="123"
                name="Neura the brainy explorer"
                topic="neural network of the brain"
                subject="science"
                duration={45}
                color="#ffda6e"
            />
            <CompanionCard
                id="456"
                name="Countsy the number wizard"
                topic="Derivatives and Integrals "
                subject="Maths"
                duration={30}
                color="#e5d0ff"
            />
            <CompanionCard
                id="789"
                name="verba the vocabulary builder "
                topic="language"
                subject="english literature"
                duration={30}
                color="#BDE7FF"
            />
        </section>
        <section className="home-section">
            <CompanionsList
                title="Recently Completed Session"
                companions={recentSessions}
                classNames="w-2/3 max-lg:w-full"
            />
            <CTA/>
        </section>
    </main>
  )
}

export default Page