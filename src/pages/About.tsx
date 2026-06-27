const About = () => (
  <main className="min-h-screen bg-background text-surface-dark-fg">
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="rounded-[2rem] border border-surface-dark-fg/10 bg-surface-dark p-10 shadow-[0_25px_100px_rgba(0,0,0,0.08)] backdrop-blur-xl">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.4em] text-primary font-semibold font-body">MOGG APP</p>
                <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight font-display">About Us</h1>
                <p className="text-sm text-surface-dark-fg/60 font-body">Where Competition Meets Community</p>
              </div>

              <div className="space-y-8 text-sm leading-7 text-surface-dark-fg/85 font-body">
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">Our Vision</h2>
                  <p>At MOGG, we believe everyone can grow through competition. We didn't just build an app; we built an ecosystem dedicated to head-to-head match-ups, rankings, and community-driven results. Our mission is to provide the tools, the data, and the community needed to help you compete, track your progress, and climb the leaderboard.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">What is MOGG?</h2>
                  <p>MOGG is an integrated Competition Arena and community platform. We combine match-up mechanics with a competitive social environment so you can see where you stand and push yourself higher.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">The Three Pillars of MOGG</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">The Lab (Data-Driven)</h3>
                      <p>Our platform tracks match-up outcomes, rankings, and performance over time. We replace guesswork with clear competition data, giving you a roadmap to climb the leaderboard.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">The Arena (Fair Competition)</h3>
                      <p>From featured match-ups to global user challenges, the Arena is where rankings are earned. Our synchronized comparison UI ensures every vote is based on fair, head-to-head judgment.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">The Hub (Collective Growth)</h3>
                      <p>Excellence isn't a solo journey. Our community feed and discussion spaces connect you with a global network of competitors dedicated to improvement, strategy, and shared progress.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">Why Join the Evolution?</h2>
                  <p>In a world of empty hype, MOGG stands for real competition. Whether you are here to track your progress, compete in the global ranks, or learn from top performers, you are part of a movement that values discipline, consistency, and the pursuit of the top spot.</p>
                  <p className="font-semibold">“Don't just watch the leaders. Become one.”</p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
);

export default About;
