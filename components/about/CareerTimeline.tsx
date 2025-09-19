import TimelineItem from './TimelineItem'

export const EXPERIENCES = [
  {
    org: 'University Of Transport And Communications',
    url: 'https://www.utc.edu.vn/',
    logo: '/static/images/experiences/utc-logo.png',
    start: 'Sep 2025',
    end: 'Present',
    title: 'Student at UTC',
    icon: 'man-technologist',
    event: 'career-utc',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          <li>
            <strong>In Process</strong>
          </li>
          {/* <li>
            Build <strong>AppCore</strong> - Developed and published core NestJS packages, including
            DatabaseModule, CacheModule, RedisModule, ConfigModule and others on npm to accelerate
            development and deployment across multiple projects.
          </li> */}
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
            <strong>Developed and maintained a web-based</strong> healthcare system to manage
            patient records, appointments, and medical reports for a Japan-based client.
          </li>
          <li>
            Supported the development of web features using <strong>Angular</strong>,{' '}
            <strong>Spring</strong> and <strong>SQL Server</strong>.
          </li>
          <li>
            <strong>Participated in Agile methodologies </strong> to boost project efficiency and
            completion rates.
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
    title: 'Student at College',
    icon: 'man-technologist',
    event: 'career-fpoly',
    details: () => {
      return (
        <ul className="[&>li]:my-2 [&>li]:pl-0">
          <li>
            Graduated with Distinction from <strong>FPT Polytechnic</strong>
          </li>
          <li>
            While most of my friends pursued careers in <strong> Front-End Developer </strong>, I
            found my passion in {''}
            <strong>Software Engineering</strong> , particularly in web and app development. This
            decision has shaped who I am today.
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
