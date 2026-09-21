import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "about",
  description: "why soffy.ing has no names, no numbers, no images and no memory.",
}

// The one permanent text on the site. Change the name in MADE_BY to whatever name should stand behind it.
const MADE_BY = "Presian Georgiev"

export default function AboutPage() {
  return (
    <>
      <p>soffy.ing is a place to write where text is the only thing that exists.</p>
      <p>
        There are no names here, no accounts, no likes, no followers, no pictures, and no archive. You write. If you
        want, you post what you wrote, with no name, at an address you can give to anyone, and thirty days later it is
        gone. That is the whole site.
      </p>

      <h2>the name</h2>
      <p>
        Soffy is <i>sophia</i>, the Greek word for wisdom that sits inside the word philosophy. The ending makes it a
        verb. Philosophy is usually a noun, something you have or study. Here it is something you do, in the present
        tense.
      </p>

      <h2>four refusals</h2>
      <p>
        <b>No names.</b> Every post is anonymous, and the site has no way to make it otherwise: there is no account to
        create, no profile to fill, no signature to add. In the second book of Plato's <i>Republic</i>, Glaucon tells of
        a ring that makes its wearer invisible and asks what anyone would do while wearing it. He expects the worst.
        This site is that ring, handed to writers. What people write when nothing they write can be traced back to them
        is an open question, and the site is a standing attempt to answer it.
      </p>
      <p>
        <b>No numbers.</b> Nothing here is liked, viewed, ranked, followed or counted. You cannot know whether a post
        was read by one person or a thousand, and neither can its author. Numbers turn writing into a performance for
        the numbers. Remove them, and the only reason left to write is the writing. It also removes every reason a bot,
        a marketer, or a language model has to be here. There is nothing to gain.
      </p>
      <p>
        <b>No images.</b> No pictures, no avatars, no logos. This page is the whole design: one typeface and words.
        Everything that can be text is text.
      </p>
      <p>
        <b>No memory.</b> Every post vanishes thirty days after it was written. Nothing here is older than a month, so
        the site is always now. Nothing is archived, nothing is exported, and every crawler that feeds a model is told
        to keep out. What is written here is written for whoever was given the address, and then it is gone. The one
        permanent text on the site is this one: the argument for why nothing else stays.
      </p>

      <h2>the page</h2>
      <p>
        Pasting is refused. The only way to put something on this site is to have typed it here. This is not a test
        for humans; there is no such test, and I will not pretend there is. It is a smaller thing: whatever appears
        here was written here, one key at a time, by someone who chose to.
      </p>

      <h2>what the site knows about you</h2>
      <p>
        Nothing it can keep. When you post, the site takes your network address, today's date and a secret, and hashes
        them together. The hash cannot be reversed, and tomorrow it is a different hash. It exists so that one person
        cannot flood the site in a day, and so that a post reported by three different people disappears. There are no
        cookies, no analytics, and no requests to anyone else's servers. Even the typeface is served from here.
      </p>

      <h2>the cost</h2>
      <p>
        Anonymity frees cruelty as easily as honesty. Glaucon predicted that, and nothing here prevents it beyond the
        report button and the thirty days. Expiry deletes good writing along with the rest; you can save your own
        before you post, and the site will not keep it for you. A post cannot be edited or deleted by its author,
        because the site cannot know who its author is. These are not flaws to be fixed later. They are the price of
        the four refusals, and the site pays it on purpose.
      </p>

      <p className="muted">made with love by {MADE_BY}.</p>
      <p className="muted">
        <i>“Men must live and create. Live to the point of tears.”</i>
      </p>
    </>
  )
}
