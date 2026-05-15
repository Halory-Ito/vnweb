// import { useAtom } from 'jotai'
import { Inter, Lora, Source_Sans_3 } from 'next/font/google'
import localFont from 'next/font/local'

// import { fontAtom } from '@/atom/global'

// define your variable fonts
const inter = Inter()
const lora = Lora()
// define 2 weights of a non-variable font
const sourceCodePro400 = Source_Sans_3({ weight: '400' })
const sourceCodePro700 = Source_Sans_3({ weight: '700' })
// define a custom local font where GreatVibes-Regular.ttf is stored in the styles folder
const LXGWWenKai = localFont({
  src: '../assets/fonts/SourceHanSerifCN-Regular.otf',
})

// export const getCustomFont = () => {
//   const [fontPath] = useAtom(fontAtom)
//   return localFont({ src: fontPath }).className
// }

export { inter, lora, sourceCodePro400, sourceCodePro700, LXGWWenKai }
