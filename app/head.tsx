export default function Head() {
  return (
    <>
      <meta
        name="fc:miniapp"
        content='{"version":"1","imageUrl":"https://cross-word-seven.vercel.app/embed.png","button":{"title":"Play Crossword","action":{"type":"launch_miniapp","url":"https://cross-word-seven.vercel.app/","name":"Crossword"}}}'
      />
      <meta
        name="fc:frame"
        content='{"version":"1","imageUrl":"https://cross-word-seven.vercel.app/embed.png","button":{"title":"Play Crossword","action":{"type":"launch_frame","url":"https://cross-word-seven.vercel.app/","name":"Crossword"}}}'
      />
    </>
  );
}
