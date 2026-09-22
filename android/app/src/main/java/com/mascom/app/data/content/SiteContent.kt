package com.mascom.app.data.content

// Generated from src/content/site.ts and src/content/gallery.ts. Keep the two in step.

data class Coordinator(val name: String, val role: String, val photo: String?, val ipm: Boolean = false)
data class Service(val no: String, val title: String, val body: String)
data class GalleryItem(val src: String, val title: String)
data class GallerySection(val title: String, val blurb: String, val items: List<GalleryItem>)
data class Stat(val value: String, val label: String)

object SiteContent {
    const val NAME = "MASCOM"
    const val LONG_NAME = "Merchandising & Sponsorship Committee"
    const val INSTITUTE = "IIM Amritsar"
    const val TAGLINE = "Drop your fit."
    const val INTRO = "Merch made for us, by us. Small drops, good stuff, gone fast. Sign in with your college email and grab yours."
    const val INSTAGRAM = "https://www.instagram.com/mascom_iimamritsar/"
    const val INSTAGRAM_HANDLE = "@mascom_iimamritsar"
    const val LINKEDIN = "https://www.linkedin.com/company/mascom-iimasr/"

    const val ABOUT_EYEBROW = "Who we are"
    const val ABOUT_TITLE = "So who's behind the drops?"
    const val ABOUT_BODY = "We're MASCOM, the Merchandising and Sponsorship Committee. Basically, we make the stuff you actually want to wear around campus. Every drop starts as a rough sketch and ends up in your hands, and we look after all of it in between."
    const val TEAM_BODY = "These are the people designing the drops, chasing the sponsors, and handing you your kit on collection day."

    val stats = listOf(
        Stat("800+", "Students served"),
        Stat("12", "Drops completed"),
        Stat("5", "Coordinators"),
    )

    val services = listOf(
        Service("01", "Getting brands on campus", "We get brands on board so campus events can be bigger, louder, and a lot better funded than they would be otherwise."),
        Service("02", "Chasing the sponsors", "We find them, make the pitch, bring in the money, then actually deliver on what we promised."),
        Service("03", "Making the merch", "Hoodies, polos, kits, whatever the occasion calls for. We design it, source it, and get it printed properly."),
        Service("04", "Keeping events running", "Someone has to chase vendors on quality, price and timelines so nothing falls apart on the day. That someone is us."),
    )

    val coordinators = listOf(
        Coordinator("Charu Jain", "Coordinator", "/coordinators/Charu.JPG"),
        Coordinator("Melapu Harsha Vardhan", "Coordinator", "/coordinators/Harshavardhan.JPG"),
        Coordinator("Hrishikesh Das", "Coordinator", "/coordinators/Hrishikesh.JPG"),
        Coordinator("Pranavu V. A.", "Coordinator", "/coordinators/Pranavu.JPG"),
        Coordinator("Sanju Jain", "Coordinator", "/coordinators/Sanju.JPG"),
        Coordinator("Dharatbeer Singh Bhatia", "IPM Coordinator", "/coordinators/Dharatbeer.png", ipm = true),
    )

    val portalPoints = listOf(
        "See every drop before it sells out",
        "Pay by UPI, no extra fees",
        "Watch your order move, live",
        "Pick it up with your order code",
    )

    val heroShots = listOf(
        "/gallery/landingpage/1.jpg",
        "/gallery/landingpage/2.jpg",
        "/gallery/landingpage/3.jpg",
    )

    val gallery = listOf(
        GallerySection(
            "Last Year Drops",
            "A look back at previous drops and the pieces people still wear.",
            listOf(
                GalleryItem("/gallery/Last%20Year%20Drops/Batch%20T-Shirt.jpeg", "Batch T-Shirt"),
                GalleryItem("/gallery/Last%20Year%20Drops/CCC%20Hoodie%20%28Back%29.jpeg", "CCC Hoodie (Back)"),
                GalleryItem("/gallery/Last%20Year%20Drops/CCC%20Hoodie%28Front%29.jpeg", "CCC Hoodie(Front)"),
                GalleryItem("/gallery/Last%20Year%20Drops/Essential%20Kit.jpeg", "Essential Kit"),
                GalleryItem("/gallery/Last%20Year%20Drops/Hoodie%28Black%29-Winter%20Merch.jpeg", "Hoodie(Black)-Winter Merch"),
                GalleryItem("/gallery/Last%20Year%20Drops/Hoodie%28Green%29%20-%20Winter%20Merch.jpeg", "Hoodie(Green) - Winter Merch"),
                GalleryItem("/gallery/Last%20Year%20Drops/Stanley.jpeg", "Stanley"),
                GalleryItem("/gallery/Last%20Year%20Drops/Varsity%28Lavender%29-Winter%20Merch.jpeg", "Varsity(Lavender)-Winter Merch"),
                GalleryItem("/gallery/Last%20Year%20Drops/Varsity%28Maroon%29-Winter%20Merch.jpeg", "Varsity(Maroon)-Winter Merch"),
                GalleryItem("/gallery/Last%20Year%20Drops/Zipper%20Hoodie-Winter%20Merch.jpeg", "Zipper Hoodie-Winter Merch"),
            ),
        ),
        GallerySection(
            "Aarunya 10.0",
            "Energy, sponsors, games, and the moments that shaped the fest.",
            listOf(
                GalleryItem("/gallery/Aarunya%2010.0/All%20eyes%20on.jpeg", "All eyes on"),
                GalleryItem("/gallery/Aarunya%2010.0/All%20the%20air%20-%20TW.jpeg", "All the air - TW"),
                GalleryItem("/gallery/Aarunya%2010.0/Bottle%20Huntin%27.jpeg", "Bottle Huntin'"),
                GalleryItem("/gallery/Aarunya%2010.0/Coke%20Stall.jpeg", "Coke Stall"),
                GalleryItem("/gallery/Aarunya%2010.0/Collab.jpeg", "Collab"),
                GalleryItem("/gallery/Aarunya%2010.0/Fav%20Stall.jpeg", "Fav Stall"),
                GalleryItem("/gallery/Aarunya%2010.0/Final%20Set%20to%20GO-%20TW.jpeg", "Final Set to GO- TW"),
                GalleryItem("/gallery/Aarunya%2010.0/Food%20Stalls.jpeg", "Food Stalls"),
                GalleryItem("/gallery/Aarunya%2010.0/For%20a%20%27Monster%27.jpeg", "For a 'Monster'"),
                GalleryItem("/gallery/Aarunya%2010.0/Monster%20A.Wrestling.jpeg", "Monster A.Wrestling"),
                GalleryItem("/gallery/Aarunya%2010.0/Our%20Sponsors.jpeg", "Our Sponsors"),
                GalleryItem("/gallery/Aarunya%2010.0/Prizes.jpeg", "Prizes"),
                GalleryItem("/gallery/Aarunya%2010.0/Sanju%20VS%20Prof.Kommu.jpeg", "Sanju VS Prof.Kommu"),
                GalleryItem("/gallery/Aarunya%2010.0/Sponsors%20%28Different%20point%20of%20time%29.jpeg", "Sponsors (Different point of time)"),
                GalleryItem("/gallery/Aarunya%2010.0/Successfully%20Completed.jpeg", "Successfully Completed"),
                GalleryItem("/gallery/Aarunya%2010.0/Trinity%20Wars%20%28TW%29.jpeg", "Trinity Wars (TW)"),
                GalleryItem("/gallery/Aarunya%2010.0/We%20In%20between.jpeg", "We In between"),
                GalleryItem("/gallery/Aarunya%2010.0/WhatsApp%20Image%202026-05-17%20at%204.18.17%20PM.jpeg", "Aarunya 10.0 moment"),
                GalleryItem("/gallery/Aarunya%2010.0/Yes%20Charu.jpeg", "Yes Charu"),
            ),
        ),
        GallerySection(
            "Scribble Day '26",
            "Signatures, memories, and one last campus canvas for the batch.",
            listOf(
                GalleryItem("/gallery/Scribble%20Day%20%2726/Flex%20Flexin%27.jpeg", "Flex Flexin'"),
                GalleryItem("/gallery/Scribble%20Day%20%2726/Flexin%27%20Continues...jpeg", "Flexin' Continues.."),
                GalleryItem("/gallery/Scribble%20Day%20%2726/Joy%20of%20Batch%20%2726.jpeg", "Joy of Batch '26"),
                GalleryItem("/gallery/Scribble%20Day%20%2726/Scribbling.jpeg", "Scribbling"),
                GalleryItem("/gallery/Scribble%20Day%20%2726/Signing%20Off.jpeg", "Signing Off"),
                GalleryItem("/gallery/Scribble%20Day%20%2726/Titans%20Batch.jpeg", "Titans Batch"),
                GalleryItem("/gallery/Scribble%20Day%20%2726/WhatsApp%20Image%202026-05-17%20at%204.16.17%20PM.jpeg", "Scribble Day '26 moment"),
            ),
        ),
        GallerySection(
            "Distribution",
            "Collection counters, QR checks, packed kits and handover moments.",
            listOf(
                GalleryItem("/gallery/Distribution/Collection%20Day.jpeg", "Collection Day"),
                GalleryItem("/gallery/Distribution/Pic%20in%20Between.jpeg", "Pic in Between"),
                GalleryItem("/gallery/Distribution/The%20Essential%20Kits.jpeg", "The Essential Kits"),
                GalleryItem("/gallery/Distribution/We.jpeg", "We"),
                GalleryItem("/gallery/Distribution/Winter%20Merch%20Ready%20to%20Collect.jpeg", "Winter Merch Ready to Collect"),
            ),
        ),
        GallerySection(
            "Behind The Scenes",
            "Design, packing, sorting, and the committee work around each drop.",
            listOf(
                GalleryItem("/gallery/Behind%20The%20Scenes/Aarunya%20Pic%20But%20in%20BTS.jpeg", "Aarunya Pic But in BTS"),
                GalleryItem("/gallery/Behind%20The%20Scenes/Belgian%20Waffle.jpeg", "Belgian Waffle"),
                GalleryItem("/gallery/Behind%20The%20Scenes/Bowling%20without%20Me.jpeg", "Bowling without Me"),
                GalleryItem("/gallery/Behind%20The%20Scenes/Cafeteria%20during%20Aarunya.jpeg", "Cafeteria during Aarunya"),
                GalleryItem("/gallery/Behind%20The%20Scenes/College%20Rivals%20Games.jpeg", "College Rivals Games"),
                GalleryItem("/gallery/Behind%20The%20Scenes/College%20Rivals.jpeg", "College Rivals"),
                GalleryItem("/gallery/Behind%20The%20Scenes/Food%20Stall%20%40Bonfire%20Beats.jpeg", "Food Stall @Bonfire Beats"),
                GalleryItem("/gallery/Behind%20The%20Scenes/Freshers%27%20Cakefied.jpeg", "Freshers' Cakefied"),
                GalleryItem("/gallery/Behind%20The%20Scenes/Got%20a%20Monster.jpeg", "Got a Monster"),
                GalleryItem("/gallery/Behind%20The%20Scenes/One%20Last%20Time.jpeg", "One Last Time"),
                GalleryItem("/gallery/Behind%20The%20Scenes/Us%20-%20But%20in%20the%20pool.jpeg", "Us - But in the pool"),
                GalleryItem("/gallery/Behind%20The%20Scenes/Us%20-%20Freshers%27.jpeg", "Us - Freshers'"),
                GalleryItem("/gallery/Behind%20The%20Scenes/Waffle%20Street%20Team.jpeg", "Waffle Street Team"),
            ),
        ),
    )
}
