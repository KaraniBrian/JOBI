import { Link, Navigate } from 'react-router-dom';
import { Loading, Seal } from '../components/ui';
import { api } from '../lib/api';
import { homeFor, useAuth } from '../lib/auth';
import { fmtSalary } from '../lib/format';
import { useAsync } from '../lib/hooks';

interface PublicJob {
  id: string; title: string; location?: string | null; is_remote: boolean;
  salary_min?: string | null; salary_max?: string | null; salary_currency?: string | null;
  companies: { company_name: string; city?: string };
  job_types: { name: string }; job_categories: { name: string };
}

const SEEKER_STEPS = [
  ['Create your account', 'Sign up free and verify your email in a minute.'],
  ['Build one resume', 'Add your experience, education and skills once, then reuse it for every job.'],
  ['Apply and track', 'Answer the employer’s questions, follow your status and get interview invites in one place.'],
];
const EMPLOYER_STEPS = [
  ['Set up your company', 'Add your details and documents. Our team verifies every employer.'],
  ['Post your jobs', 'Write the role, add your own application questions and publish once approved.'],
  ['Review and hire', 'Go through applicants, move them along, and schedule interviews without leaving JOBI.'],
];

export default function Landing() {
  const { user, loading } = useAuth();
  const jobs = useAsync(() => api.get<PublicJob[]>('/public/jobs', { limit: 6 }), []);

  if (loading) return <Loading />;
  // Signed-in people go straight to their own home.
  if (user) return <Navigate to={homeFor(user.role)} replace />;

  return (
    <div className="land">
      <header className="land-bar">
        <Link to="/" className="brand"><img src="/leaf.svg" alt="" />JOBI</Link>
        <nav className="land-links" aria-label="Main">
          <a href="#jobs">Latest jobs</a>
          <a href="#how">How it works</a>
        </nav>
        <div className="inline">
          <Link className="btn btn-ghost" to="/login">Sign in</Link>
          <Link className="btn btn-primary" to="/register">Get started</Link>
        </div>
      </header>

      <section className="land-hero">
        <div className="land-hero-copy">
          <p className="land-kicker">Jobs and hiring in one place</p>
          <h1>Where good work finds the right people.</h1>
          <p className="land-lead">
            Job seekers build one resume and apply in minutes. Employers get a verified company page and a clear queue of
            applicants. Everything from application to interview happens in JOBI.
          </p>
          <div className="inline">
            <Link className="btn btn-primary btn-lg" to="/register">Find a job</Link>
            <Link className="btn btn-ghost btn-lg" to="/register?role=employer">Post a job</Link>
          </div>
          <p className="muted small">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
        <div className="land-art" aria-hidden="true">
          <span className="leaf leaf-a" />
          <span className="leaf leaf-b" />
          <div className="art-card art-1"><strong>Application received</strong><span>Your CV is with the hiring team</span></div>
          <div className="art-card art-2"><strong>Interview scheduled</strong><span>Thursday, 10:00 · Video call</span></div>
          <div className="art-card art-3"><strong>Verified employer</strong><span>Approved by the JOBI team</span></div>
        </div>
      </section>

      <section className="land-section" id="jobs">
        <div className="spread">
          <h2>Latest jobs</h2>
          <Link to="/register">See all jobs</Link>
        </div>
        {jobs.loading && <Loading />}
        {jobs.data && jobs.data.length === 0 && (
          <p className="muted">No jobs are open right now. Employers are posting every day, so check back soon.</p>
        )}
        {jobs.error && <p className="muted">We couldn’t load jobs right now. You can still <Link to="/register">create an account</Link>.</p>}
        <div className="land-jobs">
          {jobs.data?.map((job) => {
            const salary = fmtSalary(job.salary_min, job.salary_max, job.salary_currency);
            return (
              <Link key={job.id} to={`/jobs/${job.id}`} className="land-job">
                <Seal name={job.companies.company_name} />
                <div className="grow">
                  <h3>{job.title}</h3>
                  <p className="muted small">{job.companies.company_name} · {job.is_remote ? 'Remote' : job.location ?? job.companies.city}</p>
                  <p className="small">{[job.job_types.name, salary].filter(Boolean).join(' · ')}</p>
                </div>
              </Link>
            );
          })}
        </div>
        {jobs.data && jobs.data.length > 0 && <p className="muted small" style={{ marginTop: '1rem' }}>Create a free account to see the full details and apply.</p>}
      </section>

      <section className="land-section land-how" id="how">
        <h2>How it works</h2>
        <div className="land-cols">
          <Steps title="For job seekers" steps={SEEKER_STEPS} cta={<Link className="btn btn-primary" to="/register">Create a job seeker account</Link>} />
          <Steps title="For employers" steps={EMPLOYER_STEPS} cta={<Link className="btn btn-ghost" to="/register?role=employer">Create an employer account</Link>} />
        </div>
      </section>

      <section className="land-band">
        <h2>Hire with confidence, apply with ease.</h2>
        <p>Every employer is checked by our team before they can publish a job, so you know who you are applying to.</p>
        <Link className="btn btn-primary btn-lg" to="/register">Get started free</Link>
      </section>

      <footer className="land-foot">
        <Link to="/" className="brand"><img src="/leaf.svg" alt="" />JOBI</Link>
        <span className="muted small">© {new Date().getFullYear()} JOBI</span>
        <span className="inline small"><Link to="/login">Sign in</Link><Link to="/register">Create account</Link></span>
      </footer>
    </div>
  );
}

function Steps({ title, steps, cta }: { title: string; steps: string[][]; cta: React.ReactNode }) {
  return (
    <div className="panel stack">
      <h3 style={{ fontSize: '1.25rem' }}>{title}</h3>
      <ol className="steps">
        {steps.map(([head, body], i) => (
          <li key={head}>
            <span className="step-no">{i + 1}</span>
            <div><strong>{head}</strong><p className="muted">{body}</p></div>
          </li>
        ))}
      </ol>
      <div>{cta}</div>
    </div>
  );
}
