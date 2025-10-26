'use client'
import React from 'react'
import { Twemoji } from '../ui'
import Typed from 'typed.js'
const TypedBios = () => {
  const el = React.useRef(null)
  const typed = React.useRef<Typed | null>(null)

  React.useEffect(() => {
    typed.current = new Typed(el.current, {
      stringsElement: '#bios',
      typeSpeed: 40,
      backSpeed: 10,
      loop: true,
      backDelay: 1000,
    })

    return () => typed.current?.destroy()
  }, [])

  return (
    <div>
      <ul id="bios" className="hidden">
        <li>
          I'm aliased as <b className="font-medium">Dawn</b> at work.
        </li>
        <li>
          I live in <b className="font-medium">Hanoi, Vietnam</b>.
        </li>
        <li>
          I was born in <b className="font-medium">Hanoi</b>.
        </li>
        <li>
          My first programming language was <b className="font-medium">JavaScript</b>.
        </li>
        <li>
          I’m passionate about <b className="font-medium">web development</b>.
        </li>
        <li>
          I’m currently growing as a <b className="font-medium">Software Engineer</b>.
        </li>
        <li>
          I work mostly with <b className="font-medium">Java</b> and{' '}
          <b className="font-medium">Typescript</b> technologies.
        </li>
        <li>
          I'm a tech enthusiast who loves
          <span className="ml-1">
            <Twemoji emoji="desktop-computer" />, <Twemoji emoji="keyboard" />
          </span>
        </li>
        <li>
          I enjoy listening to
          <Twemoji emoji="musical-keyboard" /> and <b className="font-medium">J-pop</b> music.
        </li>
        <li>
          I love playing video games <Twemoji emoji="video-game" />, especially{' '}
          <b className="font-medium">Dota 2</b>, <b className="font-medium">CS2</b> and{' '}
          <b className="font-medium">Hades</b>.
        </li>
      </ul>
      <span ref={el} className="text-neutral-900 dark:text-neutral-200" />
    </div>
  )
}

export default TypedBios
