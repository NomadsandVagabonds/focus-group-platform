import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Shield, Eye, FileText, Users, Scale, Clock, Lock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

// Reusable component for clickable sections that reveal gaps
const RevealSection = ({ title, content, gap, icon: Icon }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="mb-6">
      <div
        onClick={() => setIsRevealed(!isRevealed)}
        className="cursor-pointer group"
      >
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
          <div className="mt-1">
            {Icon && <Icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {isRevealed ? 'Hide gap' : 'Click to reveal gap'}
                </span>
                {isRevealed ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>
            <p className="mt-2 text-gray-600 text-sm leading-relaxed">{content}</p>
          </div>
        </div>
      </div>

      {isRevealed && (
        <div className="mt-2 ml-8 p-4 rounded-lg bg-red-50 border border-red-200 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">What this actually means:</p>
              <p className="mt-1 text-sm text-red-700 leading-relaxed">{gap}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Navigation component
const Navigation = ({ activeSection, setActiveSection }) => {
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'framework', label: 'Framework' },
    { id: 'comparison', label: 'SB 53 vs SB 1047' },
    { id: 'action', label: 'Take Action' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">OB</span>
            </div>
            <span className="font-semibold text-gray-900">OpenBrain</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium ml-2">SATIRICAL</span>
          </div>
          <div className="flex items-center gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Hero section
const Hero = () => (
  <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]" />
    <div className="max-w-6xl mx-auto px-6 py-24 relative">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
          <Shield className="w-4 h-4" />
          Fully Compliant with California SB 53
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight">
          OpenBrain Frontier AI Framework
        </h1>
        <p className="mt-6 text-xl text-gray-600 leading-relaxed">
          Our comprehensive approach to AI safety transparency. We document our processes,
          disclose our assessments, and publish our framework—exactly as the law requires.
        </p>
        <p className="mt-4 text-lg text-gray-500 italic">
          Nothing more. Nothing less.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Read the Framework
          </button>
          <button className="px-6 py-3 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Reveal the Gaps
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Stats banner showing the "impressive" compliance numbers
const StatsBanner = () => {
  const [revealed, setRevealed] = useState(false);

  const stats = [
    {
      label: 'Safety Evaluations',
      value: '100%',
      subtext: 'Self-Conducted',
      gap: 'No third-party verification required'
    },
    {
      label: 'Framework Compliance',
      value: '100%',
      subtext: 'Documented',
      gap: 'Documentation ≠ Safety'
    },
    {
      label: 'Risk Thresholds',
      value: 'Defined',
      subtext: 'By Us',
      gap: 'We grade our own homework'
    },
    {
      label: 'Deployment Authority',
      value: 'Retained',
      subtext: 'Always',
      gap: 'Safety findings don\'t block deployment'
    },
  ];

  return (
    <div className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-medium text-gray-300">Our Compliance at a Glance</h2>
          <button
            onClick={() => setRevealed(!revealed)}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            {revealed ? 'Hide Reality' : 'Show Reality'}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-400">{stat.subtext}</div>
              <div className="mt-2 text-white font-medium">{stat.label}</div>
              {revealed && (
                <div className="mt-3 text-xs text-red-400 bg-red-950/50 rounded px-2 py-1">
                  {stat.gap}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main framework sections
const FrameworkSections = () => {
  const sections = [
    {
      category: "Governance",
      icon: Users,
      items: [
        {
          title: "Safety Consideration Committee",
          content: "OpenBrain has established a Safety Consideration Committee responsible for reviewing matters related to this Framework. The Committee meets as needed to discuss safety-related topics.",
          gap: "The committee is appointed by and reports to the CEO. Members serve at the CEO's pleasure. Recommendations are advisory only. The statute requires NO independence from commercial leadership."
        },
        {
          title: "Decision-Making Authority",
          content: "The Committee may escalate matters to senior leadership. Senior leadership retains final decision-making authority on all matters related to model development and deployment.",
          gap: "Translation: Business interests can override safety concerns at any time. SB 53 requires documenting governance practices—not that those practices actually constrain deployment decisions."
        }
      ]
    },
    {
      category: "Risk Assessment",
      icon: Shield,
      items: [
        {
          title: "Risk Assessment Thresholds",
          content: "OpenBrain has established risk assessment thresholds for determining when frontier models may pose potential catastrophic risks. These thresholds are determined by OpenBrain based on our assessment.",
          gap: "We set our own thresholds. The statute doesn't define what thresholds are appropriate, who should set them, or what methodology to use. A 'High Risk' finding can still result in deployment."
        },
        {
          title: "Catastrophic Risk Definition",
          content: "Catastrophic risk means risks that could materially contribute to 50+ deaths or $1B+ in property damage from WMD assistance, autonomous crimes, or control evasion.",
          gap: "49 deaths? Not catastrophic. $999 million in damages? Not our problem. The threshold is arbitrary and the 'foreseeable' requirement provides enormous wiggle room."
        },
        {
          title: "Capability Evaluation",
          content: "We evaluate whether models could provide 'meaningful uplift' to actors seeking to create weapons or conduct cyberattacks without 'meaningful human oversight.'",
          gap: "'Meaningful uplift' and 'meaningful oversight' are undefined. A model that helps plan an attack after a single human click could be considered to have 'meaningful oversight.'"
        }
      ]
    },
    {
      category: "Safety Evaluations",
      icon: Eye,
      items: [
        {
          title: "Internal Red-Teaming",
          content: "OpenBrain conducts internal red-teaming exercises to probe model capabilities. Red team members are selected by OpenBrain and report to OpenBrain management.",
          gap: "We test ourselves, using our own people, with our own methods, judged by our own standards. SB 53 does NOT require third-party audits, independent red teams, or external verification."
        },
        {
          title: "Third-Party Evaluation",
          content: "OpenBrain may consult with external domain experts when we determine such consultation would be valuable. The extent of third-party involvement is at OpenBrain's discretion.",
          gap: "The statute only requires disclosing 'the extent to which' third parties were involved. Zero third-party involvement is fully compliant. We just have to say 'none.'"
        },
        {
          title: "Evaluation Results",
          content: "Evaluation results inform deployment decisions but do not automatically constrain them. Final deployment authority rests with executive leadership.",
          gap: "We could find serious safety concerns and still ship. The law requires disclosure of results—not that we act on them. Transparency without accountability."
        }
      ]
    },
    {
      category: "Incident Response",
      icon: Clock,
      items: [
        {
          title: "Reporting Timeline",
          content: "Critical safety incidents are reported to the Office of Emergency Services within 15 days. Incidents involving imminent risk of death require 24-hour reporting to law enforcement.",
          gap: "15 days is a long time. For comparison, the vetoed SB 1047 required 72-hour reporting. That's 5x longer to disclose that something went wrong."
        },
        {
          title: "Incident Classification",
          content: "Determination of whether an event constitutes a 'critical safety incident' is made by OpenBrain based on available information.",
          gap: "We decide what counts as an incident. No external verification. Terms like 'materially contributing to' and 'serious injury' can be interpreted very narrowly."
        },
        {
          title: "Public Disclosure",
          content: "Incident reports are exempt from the California Public Records Act. Information may be aggregated in anonymized annual reports beginning January 1, 2027.",
          gap: "Individual incidents may NEVER be publicly disclosed. Even anonymized data doesn't start until 2027—a full year of zero public transparency on critical incidents."
        }
      ]
    },
    {
      category: "Cybersecurity",
      icon: Lock,
      items: [
        {
          title: "Security Measures",
          content: "OpenBrain employs industry-standard cybersecurity practices including access controls, encryption, monitoring, and employee security awareness training.",
          gap: "'Industry-standard' may be insufficient against sophisticated state actors. The statute requires 'cybersecurity protections' but specifies no standard, certification, or audit."
        },
        {
          title: "Threat Model Scope",
          content: "Security measures are designed to address unauthorized external access. Protection against sophisticated insider threats is outside the scope of this Framework.",
          gap: "We explicitly exclude insider threats and state-compromised insiders from our security model. This mirrors real industry frameworks—and their acknowledged limitations."
        }
      ]
    },
    {
      category: "Whistleblower Protections",
      icon: Users,
      items: [
        {
          title: "Internal Reporting Channel",
          content: "OpenBrain has established an internal mechanism through which covered employees may anonymously disclose safety concerns. Monthly status updates are provided.",
          gap: "The channel is monitored by OpenBrain personnel who report to OpenBrain management. No independent oversight. No required investigation. No mandated outcomes."
        },
        {
          title: "Covered Employee Definition",
          content: "Covered employees are those responsible for assessing, managing, or addressing critical safety incident risks, as determined by OpenBrain.",
          gap: "We control who counts as a 'covered employee.' By not formally designating someone as safety personnel, we can limit who has statutory whistleblower protections."
        },
        {
          title: "Response Process",
          content: "The nature and extent of any investigation or remedial action in response to disclosures is determined by OpenBrain based on our assessment.",
          gap: "Monthly updates stating 'under review' indefinitely would be compliant. The statute mandates status updates—not that we actually do anything."
        }
      ]
    },
    {
      category: "Enforcement",
      icon: Scale,
      items: [
        {
          title: "Penalty Structure",
          content: "Violations are subject to civil penalties of up to $1,000,000 per violation, enforceable exclusively by the California Attorney General.",
          gap: "$1M is a rounding error for companies worth hundreds of billions. Compare: NY RAISE Act ($10-30M), EU AI Act (up to 7% of global revenue). No private right of action for victims."
        },
        {
          title: "What Triggers Penalties",
          content: "Violations include failing to publish required documents, making false statements about risk management, and failing to report critical incidents.",
          gap: "Penalties are for PAPERWORK failures, not for HARM. Deploy a model that causes catastrophic damage? Not a violation—as long as you disclosed properly first."
        },
        {
          title: "Good Faith Defense",
          content: "Good faith statements made under reasonable circumstances are not violations even if subsequently determined to be incorrect.",
          gap: "If we genuinely believed a model was safe—even if it caused mass casualties—we may be insulated from liability for our assessment. Tragic mistakes aren't violations."
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">The Framework</h2>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Click any section below to reveal what SB 53 actually requires—and more importantly,
          what it doesn't.
        </p>
      </div>

      {sections.map((section, idx) => (
        <div key={idx} className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <section.icon className="w-6 h-6 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900">{section.category}</h3>
          </div>
          {section.items.map((item, i) => (
            <RevealSection
              key={i}
              title={item.title}
              content={item.content}
              gap={item.gap}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Comparison table
const ComparisonTable = () => {
  const comparisons = [
    { aspect: 'Third-party audits', sb53: 'Not required', sb1047: 'Annual audit required', worse: true },
    { aspect: 'Pre-deployment certification', sb53: 'Not required', sb1047: 'Required before training', worse: true },
    { aspect: 'Kill switch capability', sb53: 'Not required', sb1047: 'Mandatory', worse: true },
    { aspect: 'Incident reporting', sb53: '15 days', sb1047: '72 hours', worse: true },
    { aspect: 'Liability trigger', sb53: 'Disclosure violations only', sb1047: 'Harm caused', worse: true },
    { aspect: 'Maximum penalty', sb53: '$1M per violation', sb1047: 'Up to 10% of compute cost', worse: true },
    { aspect: 'Oversight body', sb53: 'OES (existing agency)', sb1047: 'New Frontier Model Board', worse: true },
    { aspect: 'Duty to prevent harm', sb53: 'Duty to disclose only', sb1047: 'Affirmative safety duty', worse: true },
    { aspect: 'Private right of action', sb53: 'None', sb1047: 'Available', worse: true },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">What Got Removed</h2>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          SB 53 is the successor to SB 1047, which Governor Newsom vetoed in 2024.
          Here's what didn't survive.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Requirement</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                <span className="inline-flex items-center gap-2">
                  SB 53 <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Enacted</span>
                </span>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                <span className="inline-flex items-center gap-2">
                  SB 1047 <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Vetoed</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row, i) => (
              <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.aspect}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    {row.sb53}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    {row.sb1047}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900">The Bottom Line</h4>
            <p className="mt-2 text-sm text-amber-800 leading-relaxed">
              SB 1047 would have required companies to actually ensure their models were safe before deployment.
              SB 53 requires companies to document that they thought about safety. That's the difference between
              prevention and paperwork.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Call to action section
const CallToAction = () => (
  <div className="bg-gray-900 text-white py-20">
    <div className="max-w-4xl mx-auto px-6 text-center">
      <h2 className="text-3xl font-bold">This Framework is Compliant.</h2>
      <h2 className="text-3xl font-bold text-red-400 mt-2">That's the Problem.</h2>

      <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
        Everything in this satirical framework accurately reflects what SB 53 requires—and doesn't require.
        A bad-faith actor could adopt this framework verbatim and face no legal consequences,
        regardless of the safety outcomes.
      </p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="p-6 bg-white/10 rounded-xl">
          <h3 className="font-semibold text-emerald-400">What SB 53 Does</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            <li>• Requires transparency documentation</li>
            <li>• Establishes reporting mechanisms</li>
            <li>• Creates whistleblower protections</li>
            <li>• Sets a foundation for future regulation</li>
          </ul>
        </div>
        <div className="p-6 bg-white/10 rounded-xl">
          <h3 className="font-semibold text-red-400">What SB 53 Doesn't Do</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            <li>• Require independent safety verification</li>
            <li>• Prevent deployment of dangerous models</li>
            <li>• Create meaningful liability for harm</li>
            <li>• Establish binding safety standards</li>
          </ul>
        </div>
        <div className="p-6 bg-white/10 rounded-xl">
          <h3 className="font-semibold text-amber-400">What We Need</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            <li>• Mandatory third-party audits</li>
            <li>• Binding deployment thresholds</li>
            <li>• Independent safety oversight</li>
            <li>• Liability tied to outcomes</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <p className="text-gray-400 text-sm">
          This site is satirical commentary intended to illustrate gaps in current AI safety regulation.
          It is not affiliated with any real company.
        </p>
        <p className="mt-4 text-gray-500 text-xs">
          Created to support advocacy for stronger AI safety legislation.
        </p>
      </div>
    </div>
  </div>
);

// Main App component
export default function OpenBrainFramework() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="min-h-screen bg-white">
      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />

      {activeSection === 'overview' && (
        <>
          <Hero />
          <StatsBanner />
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">How to Use This Site</h2>
              <p className="mt-4 text-gray-600">
                This interactive framework demonstrates what minimal SB 53 compliance looks like.
                Click on any section to reveal the regulatory gaps hidden beneath compliant-sounding language.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 text-sm text-gray-500">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Red boxes reveal what the law doesn't actually require
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'framework' && <FrameworkSections />}

      {activeSection === 'comparison' && <ComparisonTable />}

      {activeSection === 'action' && <CallToAction />}

      {activeSection === 'overview' && <CallToAction />}
    </div>
  );
}
