import TimelineItem from './TimelineItem'

export const EXPERIENCES = [
  {
    org: 'University of Transport and Communications',
    url: 'https://www.utc.edu.vn/',
    logo: '/static/images/experiences/utc-logo.png',
    start: 'Sep 2025',
    end: 'Present',
    title: 'Undergraduate Student at UTC',
    icon: 'man-technologist',
    event: 'career-utc',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          <li>
            <strong>Undergraduate student.</strong>
          </li>
        </ul>
      )
    },
  },
  {
    org: 'FPT Software',
    url: 'https://fptsoftware.com/',
    logo: '/static/images/experiences/fsoft-logo.png',
    start: 'Aug 2024',
    end: 'Nov 2024',
    title: 'Intern Web Developer',
    icon: 'man-technologist',
    event: 'career-intern-fsoft',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          <li>
            Developed and maintained a <strong>web-based healthcare system</strong> to manage
            patient records, appointments, and medical reports for a Japan-based client.
          </li>
          <li>
            Supported the development of web features using <strong>Angular</strong>,{' '}
            <strong>Spring</strong>, and <strong>SQL Server</strong>.
          </li>
          <li>
            Participated in <strong>Agile methodologies processes</strong> to improve team
            efficiency and project delivery.
          </li>
        </ul>
      )
    },
  },
  {
    org: 'FPT Polytechnic College',
    url: 'https://caodang.fpt.edu.vn/',
    logo: '/static/images/experiences/fpoly-logo.png',
    start: 'Aug 2022',
    end: 'May 2025',
    title: 'College Student',
    icon: 'man-technologist',
    event: 'career-fpoly',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          <li>
            Graduated with Distinction from <strong>FPT Polytechnic College</strong>.
          </li>
          <li>
            Specialized in building modern web applications using technologies such as{' '}
            <strong>Node.js</strong>, <strong>Express</strong>, <strong>React</strong>, and{' '}
            <strong>MongodDB</strong>, following the <strong>MERN stack</strong>.
          </li>
          <li>
            Developed a strong foundation in <strong>RESTful API design</strong>,{' '}
            <strong>database management</strong>, and <strong>UI/UX principles</strong>.
          </li>
          <li>
            Enhanced <strong>problem-solving</strong> and <strong>team collaboration</strong> skills
            through real-world projects and coding challenges.
          </li>
          <li>
            While many peers focused on <strong>Front-End Development</strong>, I discovered my
            passion for <strong>Software Engineering</strong>, where I can combine creativity with
            technical depth to build <strong>end-to-end web solutions</strong>.
          </li>
        </ul>
      )
    },
  },
]

const CareerTimeline = () => (
  <ul className="m-0 list-none p-0">
    {EXPERIENCES.map((experience, idx) => (
      <li key={experience.url} className="m-0 p-0">
        <TimelineItem exp={experience} last={idx === EXPERIENCES.length - 1} />
      </li>
    ))}
  </ul>
)

export default CareerTimeline
