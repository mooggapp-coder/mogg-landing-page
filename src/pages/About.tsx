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
                <p className="text-sm text-surface-dark-fg/60 font-body">The Standard of Aesthetic Excellence</p>
              </div>

              <div className="space-y-8 text-sm leading-7 text-surface-dark-fg/85 font-body">
                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">Our Vision</h2>
                  <p>At MOGG, we believe that everyone has a peak aesthetic potential. We didn't just build an app; we built an ecosystem dedicated to the science of physical optimization. Our mission is to provide the tools, the data, and the community needed to help you understand, track, and achieve your most optimized self.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">What is MOGG?</h2>
                  <p>MOGG is the world’s first integrated Aesthetic Arena and Optimization Hub. We combine state-of-the-art AI technology with a competitive social environment to create a transparent standard for human aesthetics.</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">The Three Pillars of MOGG</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">The Lab (Science-First)</h3>
                      <p>Our AI-driven analysis breaks down facial harmony, bone structure, and dimorphic ratios. We replace guesswork with objective data, giving you a clear roadmap for improvement.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">The Arena (Fair Competition)</h3>
                      <p>From celebrity battles to global user matchups, the Arena is where the standard is defined. Our synchronized comparison UI ensures every vote is based on precision and fair judgment.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-dark-fg">The Hub (Collective Growth)</h3>
                      <p>Excellence isn't a solo journey. Our community feed and discussion spaces connect you with a global network of individuals dedicated to self-improvement, grooming, and aesthetic science.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-semibold text-surface-dark-fg">Why Join the Evolution?</h2>
                  <p>In a world of filters and deception, MOGG stands for Objective Reality. Whether you are here to analyze your progress, compete in the global ranks, or learn from the elite, you are part of a movement that values discipline, optimization, and the pursuit of perfection.</p>
                  <p className="font-semibold">“Don’t just watch the elite. Become one.”</p>
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
