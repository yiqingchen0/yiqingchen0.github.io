/**
 * Everything personal about the site lives here, apart from the long-form
 * content (src/content, src/data) and the page text (src/pages).
 */

export interface NavItem {
	label: string;
	href: string;
}

export interface ExternalLink {
	label: string;
	/** Leave empty to hide the link. */
	href: string;
}

export interface TimelineItem {
	period: string;
	title: string;
	place: string;
}

export interface SiteConfig {
	name: string;
	role: string;
	/** Short affiliation shown after the role, e.g. on the About page. */
	affiliation: string;
	/**
	 * How your name is written in author lists, so it can be highlighted.
	 * List every form that appears in your papers.
	 */
	authorNames: readonly string[];
	description: string;
	email: string;
	nav: readonly NavItem[];
	links: readonly ExternalLink[];
	appointments: readonly TimelineItem[];
	education: readonly TimelineItem[];
	talks: readonly TimelineItem[];
	honors: readonly TimelineItem[];
}

export const site: SiteConfig = {
	name: 'Yiqing Chen',
	role: 'Assistant Professor of Biostatistics',
	affiliation: 'School of Public Health, Texas A&M University',
	authorNames: ['Chen Y', 'Chen YE'],
	description:
		'Yiqing Chen, Assistant Professor of Biostatistics at Texas A&M University: causal mediation, Bayesian and stochastic methods for oncology.',
	email: 'y.chen@tamu.edu',
	nav: [
		{ label: 'Research', href: '/research/' },
		{ label: 'Publications', href: '/publications/' },
		{ label: 'Teaching', href: '/teaching/' },
		{ label: 'About', href: '/about/' },
	],
	// Links with an empty href are not shown.
	links: [
		{ label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=NvCVsWoAAAAJ&hl=en' },
		{ label: 'ORCID', href: '' },
		{ label: 'GitHub', href: '' },
		{ label: 'LinkedIn', href: '' },
	],
	appointments: [
		{
			period: '2025 – present',
			title: 'Assistant Professor of Biostatistics (tenure-track)',
			place: 'Department of Epidemiology & Biostatistics, School of Public Health, Texas A&M University',
		},
		{ period: '2021 – 2025', title: 'Graduate Research Assistant', place: 'The University of Texas MD Anderson Cancer Center' },
		{ period: '2023', title: 'Statistical Intern', place: 'Oncology Statistics, Bayer USA' },
		{
			period: '2020 – 2021',
			title: 'Graduate Research Assistant',
			place: 'The University of Texas Health Science Center at Houston',
		},
		{
			period: '2017 – 2020',
			title: 'Data Management Analyst',
			place: 'Department of Pharmacotherapy and Translational Research, University of Florida',
		},
	],
	education: [
		{
			period: '2020 – 2025',
			title: 'PhD in Biostatistics, double minor in Data Science and Epidemiology',
			place: 'The University of Texas',
		},
		{ period: '2015 – 2017', title: 'MS in Biostatistics', place: 'University of Florida' },
		{ period: '2010 – 2014', title: 'Bachelor in Bioinformatics', place: 'Tongji University, China' },
	],
	talks: [
		{
			period: 'Sep 2026',
			title: 'Bayesian Mediation Multistate Model Elucidates the Impact of Treatment Response on Oncology Endpoint',
			place: 'Invited seminar, Bio2 Data Science Seminar, Moffitt Cancer Center, Tampa, FL',
		},
		{
			period: 'Aug 2026',
			title: 'Stochastic Modeling of Lymphocyte Kinetics Reveals Mechanistic Biomarkers post Cancer Chemoradiation',
			place: 'Topic-contributed paper session, Joint Statistical Meetings (JSM) 2026, Boston, MA',
		},
		{
			period: 'Aug 2026',
			title: 'Geometry-Preserving Embedding of Multiple Networks via Intrinsic Dimension and Anchor Alignment (co-author)',
			place: 'Contributed paper session, Joint Statistical Meetings (JSM) 2026, Boston, MA',
		},
		{
			period: 'Apr 2026',
			title: 'Quantifying Mediated Treatment Effects to Support Accelerated Approval Decision-Making in Oncology',
			place: 'Duke Industry Statistics Symposium (DISS) 2026, Cary, NC',
		},
		{
			period: 'Mar 2026',
			title: 'Bayesian Causal Mediation Multistate Criteria Design Improves Oncology Drug Accelerated Approval Decisions',
			place: 'Invited seminar, Faculty Research Seminar Series, School of Public Health, Texas A&M University',
		},
		{
			period: 'Aug 2025',
			title: 'Bayesian Multi-State Mediation Model Elucidates the Impact of Treatment Response on Oncology Endpoint',
			place: 'Contributed paper session, Joint Statistical Meetings (JSM) 2025, Nashville, TN',
		},
		{
			period: 'Apr 2024',
			title: 'Quantifying the Impact of Immunosuppression Dynamics During Chemoradiation on Cancer Survival Using TGD Model',
			place: 'Society of Decision Professionals Annual Conference',
		},
		{
			period: '2023',
			title: 'Informative Bayesian Survival Modeling in Studies with Time-to-Event Endpoint',
			place: 'Oral presentation and poster, ASA New Jersey and Princeton-Trenton Chapters',
		},
		{
			period: 'Jul 2023',
			title: 'Radiation-Induced Lymphopenia is a Causal Mediator of Esophagus Cancer Survival',
			place: 'AAPM 65th Annual Meeting & Exhibition, Houston, TX',
		},
		{
			period: 'May 2023',
			title: 'Lymphocyte Kinetics Impact the Overall Survival of Esophageal Cancer Patients Receiving Chemoradiation',
			place: 'Stat4Onc Annual Symposium, Portland, OR',
		},
	],
	honors: [
		{
			period: 'Jul 2023',
			title: 'John R. Cameron Early-Career Investigators Finalist',
			place: 'AAPM Annual Meeting 2023, Houston, TX',
		},
		{ period: 'May 2023', title: 'Poster Award', place: 'Stat4Onc Annual Symposium 2023, Portland, OR' },
		{
			period: 'May 2023',
			title: 'Advanced Data Science Certificate',
			place: 'The University of Texas Health Science Center at Houston',
		},
		{ period: 'Feb 2022', title: 'Cover illustration, Genome Research 32(2)', place: 'Cold Spring Harbor Laboratory Press' },
		{ period: 'Nov 2018', title: 'Cover illustration, Genome Research 28(11)', place: 'Cold Spring Harbor Laboratory Press' },
		{
			period: 'Jul 2014',
			title: 'Excellent Dissertation Defense',
			place: 'School of Life Science and Technology, Tongji University',
		},
		{ period: 'Feb 2014', title: 'Cover illustration, Genome Research 24(2)', place: 'Cold Spring Harbor Laboratory Press' },
		{ period: 'Feb 2014', title: 'Special Award of Merit', place: 'Shanghai Key Laboratory of Signaling and Disease Research' },
	],
};

export const externalLinks = site.links.filter((link) => link.href !== '');
