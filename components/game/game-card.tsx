import Image from 'next/image'

export default function GameCard(props: GameCardProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-1">
      <Image
        className="cursor-pointer rounded-lg border border-transparent object-contain transition-all duration-300 hover:scale-102 hover:border-blue-500"
        src={props.cover}
        alt={props.title}
        width={128}
        height={196}
      />

      <div className="max-w-30 truncate text-center">{props.title}</div>
    </div>
  )
}
