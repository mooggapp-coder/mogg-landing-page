import { useNavigate } from "react-router-dom";

const SUPPORT_EMAIL = "mooggapp@gmail.com";

const Support = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-surface-dark-fg">
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl space-y-10">
            <div className="rounded-[2rem] border border-surface-dark-fg/10 bg-surface-dark p-10 shadow-[0_25px_100px_rgba(0,0,0,0.08)] backdrop-blur-xl">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.4em] text-primary font-semibold font-body">MOGG APP</p>
                  <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight font-display">MOGG Support</h1>
                  <p className="text-sm text-surface-dark-fg/60 font-body">Need help? We&apos;re here for you.</p>
                </div>

                <div className="space-y-8 text-sm leading-7 text-surface-dark-fg/85 font-body">
                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-surface-dark-fg">Contact Us</h2>
                    <p>
                      Email us at{" "}
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-primary hover:underline">
                        {SUPPORT_EMAIL}
                      </a>
                    </p>
                    <p>
                      <button
                        type="button"
                        onClick={() => navigate("/contact")}
                        className="inline-flex items-center bg-foreground hover:bg-primary text-background font-semibold px-5 py-2 rounded-lg text-sm transition-all font-body"
                      >
                        Contact Support
                      </button>
                    </p>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-surface-dark-fg">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-surface-dark-fg">How do I delete my account?</h3>
                        <p>
                          Open the MOGG app, go to <span className="font-semibold">Settings</span>, then tap{" "}
                          <span className="font-semibold">Delete Account</span>. Follow the on-screen prompts to permanently
                          remove your account and associated data.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-surface-dark-fg">How do I cancel my subscription?</h3>
                        <p>
                          Subscriptions are managed through the App Store. On your iPhone, open{" "}
                          <span className="font-semibold">Settings</span> → tap your name →{" "}
                          <span className="font-semibold">Subscriptions</span> → select MOGG → tap{" "}
                          <span className="font-semibold">Cancel Subscription</span>. Your premium access continues until
                          the end of the current billing period.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-surface-dark-fg">How do I report inappropriate content?</h3>
                        <p>
                          Use the in-app reporting feature on any post or profile you want to flag. Tap the menu icon on
                          the content, select <span className="font-semibold">Report</span>, and choose the reason. Our
                          team reviews all reports promptly.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Support;
