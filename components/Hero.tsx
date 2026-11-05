interface HeroProps {
    title: string;
    desc: string;
}

export default function Hero({title, desc} : HeroProps) {
    return (
        <div className="flex flex-col justify-start items-center gap-3 mt-25 mb-25">
            <h1>{title}</h1>
            <h3>{desc}</h3>
        </div>
    )
}