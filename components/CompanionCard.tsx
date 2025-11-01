"use client"
import Image from "next/image"
import Link from "next/link"
import {useState, useTransition} from "react";
import {toggleBookmark} from "@/lib/actions/companion.actions";



interface CompanionCardProps{
    id: string;
    name: string;
    topic: string;
    subject: string;
    duration: number;
    color: string;
    is_bookmarked: boolean;
    onToggleBookmark?: () => void;
}


const CompanionCard = ({id , name,topic, subject, duration, color, is_bookmarked,onToggleBookmark }: CompanionCardProps
)=> {
    const [bookmarked, setBookmarked] = useState(is_bookmarked)
    const [isPending, startTransition] = useTransition()

    const handleBookmarkToggle = () => {
        const newValue = !bookmarked;
        setBookmarked(newValue);

        startTransition(async () => {
            const result = await toggleBookmark(id, newValue);

            if (!result.success) {
                setBookmarked(!newValue);
                console.error("Error updating bookmark:", result.error);
            } else if (onToggleBookmark) {
                onToggleBookmark();
            }
        });
    }

    return (
        <article className="companion-card" style={{backgroundColor: color}}>
            <div className="flex justify-between items-center">
                <div className="subject-badge">{subject}</div>
                <button
                    onClick={handleBookmarkToggle}
                    disabled={isPending}
                    aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
                    className="companion-bookmark p-1 rounded-md hover:bg-gray-200"
                >
                    <Image
                        src={
                            bookmarked
                                ? "/icons/bookmark-filled.svg" // highlight when active
                                : "/icons/bookmark.svg"
                        }
                        alt="bookmark"
                        width={14}
                        height={16}
                    />
                </button>
            </div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm">{topic}</p>
            <div className="flex items-center gap-2">
                <Image src="icons/clock.svg" alt="duration"
                       width={13.5}
                       height={13.5}
                />
                <p className="text-sm">{duration} minutes</p>
            </div>
            <Link href={`/companions/${id}`} className="w-full">
                <button className="btn-primary w-full justify-center">
                    Launch Lesson
                </button>
            </Link>
        </article>
    )
}

export default CompanionCard