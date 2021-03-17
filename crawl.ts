import { DOMParser, Element, Node } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts'
import { ensureDir } from 'https://deno.land/std@0.90.0/fs/mod.ts'

async function ask(
    question = '',
    stdin = Deno.stdin,
    stdout = Deno.stdout,
): Promise<string> {
    const buf = new Uint8Array(1024)

    // Write question to console
    await stdout.write(new TextEncoder().encode(`\n\n${question}`))

    // Read console input
    const n = <number>await stdin.read(buf)
    const answer = new TextDecoder().decode(buf.subarray(0, n))

    return answer.trim()
}

async function shouldRunAgain(): Promise<boolean> {
    const again =
        (await ask('Would you like to run the script again?\n\n[y / n] > '))
            .toLowerCase()
    if (again === 'y') {
        return true
    } else if (again === 'n') {
        return false
    } else {
        return await shouldRunAgain()
    }
}

function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function getPastPapers() {
    // Get Groups
    const groupsUrl = 'https://www.ibdocuments.com/IB%20PAST%20PAPERS%20-%20SUBJECT/'

    const groupsPage = await fetch(groupsUrl)
    const groupsDom = new DOMParser().parseFromString(
        await groupsPage.text(),
        'text/html',
    )
    if (groupsDom === null) {
        console.error('Error fetching from ibdocuments')
        return
    }

    const groupEls = Array.from(groupsDom.querySelectorAll('a'))
        .filter((el: Node) => {
            return el.textContent.toLowerCase().includes('group')
        })

    const groups = groupEls
        .map((el: Node, idx: number) =>
            `${idx + 1}: ${el.textContent.replace(/\/$/g, '')}`
        )
        .map((el: string) => el.replace(/Group [0-9] - /g, ''))

    const groupsLinks = groupEls
        .map((el: Node) => groupsUrl + (el as Element).getAttribute('href'))

    const groupsIdxs = groups.map((_, idx: number) => `${idx + 1}`)

    const group = await ask(
        `Select a group:\n${groups.join('\n')}\n\n[1...${groupsIdxs.length}] > `,
    )

    const groupIdx = groupsIdxs.indexOf(group)
    if (groupIdx < 0 || groupIdx >= groupsLinks.length) {
        console.error('Invalid Group')
        return
    }

    const grouplink = groupsLinks[groupIdx]

    // Get Subjects
    const subjectsPage = await fetch(grouplink)
    const subjectsDom = new DOMParser().parseFromString(
        await subjectsPage.text(),
        'text/html',
    )

    if (subjectsDom === null) {
        console.error('Failed to get exams')
        return
    }

    const subjectsCssString = 'table#indexlist tr:not(.even-parentdir) td.indexcolname a'
    const subjectsEls = Array.from(subjectsDom.querySelectorAll(subjectsCssString))
        .map((el: Node) => (el as Element))

    const subjects = subjectsEls
        .map((el: Element) => el.textContent)
        .map((sub: string) => sub.replace(/_/g, ' '))
        .map((sub: string) => sub.replace(/\/$/g, ''))
        .map((sub: string, idx: number) => `${idx + 1}: ${sub}`)

    const subjectsIdxs = subjectsEls
        .map((_ , idx: number) => `${idx + 1}`)

    const subjectsLinks = subjectsEls
        .map((el: Element) => grouplink + el.getAttribute('href'))

    const subject = await ask(`Select a subject:\n${subjects.join('\n')}\n\n[1...${subjects.length}] > `)
    const subjectIdx = subjectsIdxs.indexOf(subject)
    if (subjectIdx < 0 || subjectIdx >= subjects.length) {
        console.error('Invalid subject')
        return
    }

    const subjectLink = subjectsLinks[subjectIdx]



    // Get Exams
    const examsPage = await fetch(subjectLink)
    const examsDom = new DOMParser().parseFromString(
        await examsPage.text(),
        'text/html',
    )

    if (examsDom === null) {
        console.error('Failed to get exams')
        return
    }

    const examsCssString = 'table#indexlist tr:not(.even-parentdir) td.indexcolname a'
    const examsEls = Array.from(examsDom.querySelectorAll(examsCssString))
        .map((el: Node) => (el as Element))

    const exams = examsEls
        .map((el: Element) => el.textContent)
        .map((sub: string) => sub.replace(/_/g, ' '))
        .map((sub: string) => sub.replace(/\/$/g, ''))
        .map((sub: string, idx: number) => `${idx + 1}: ${sub}`)

    const examsIdxs = examsEls
        .map((_ , idx: number) => `${idx + 1}`)

    const examsLinks = examsEls
        .map((el: Element) => subjectLink + el.getAttribute('href'))

    const exam = await ask(`What's the earliest exam you want to download?\n${exams.join('\n')}\n\n[1...${exams.length}] > `)
    const examIdx = examsIdxs.indexOf(exam)
    if (examIdx < 0 || examIdx >= exams.length) {
        console.error('Invalid subject')
        return
    }

    const dirname = subjects[subjectIdx].replace(/^[0-9]+: /g, '')

    await ensureDir(dirname)

    for (let idx = examIdx; idx < exams.length; idx++) {
        const examName = exams[idx].replace(/^[0-9]+: /g, '')
        console.log(`Downloading "${examName}"...`)
        const link = examsLinks[idx]

        const sessionPage = await fetch(link)
        const sessionDom = new DOMParser().parseFromString(
            await sessionPage.text(), 
            'text/html'
        )

        if (sessionDom === null) {
            console.log('failed')
            return
        }
        
        await ensureDir(`${dirname}/${examName}`)

        const selector = 'table#indexlist tr:not(.even-parentdir) td.indexcolname a'
        const papers = Array.from(sessionDom.querySelectorAll(selector))
        
        for (const paper of papers) {
            const el = paper as Element
            const href = link + el.getAttribute('href')
            const paperName = el.textContent

            Deno.stdout.writeSync(new TextEncoder().encode(`Downloading ${paperName}...`))
            const res = await fetch(href)
            const file = new Uint8Array(await res.arrayBuffer())
            await Deno.writeFile(`${dirname}/${examName}/${paperName}`, file)
            console.log('done')
        }

        console.log('done')
    }
}

// async function getDataBooklets() {
// }

while (true) {
    // const res = await ask(
    //     '\n\n\nWhat would you like to download?\n1) Past papers\n2) Data and Formula booklets\n\n[1 / 2] > ',
    // )

    // if (res === '1') {
    //     await getPastPapers()
    // } else if (res === '2') {
    //     await getDataBooklets()
    // } else {
    //     console.log('Invalid Input')
    // }


    await getPastPapers()

    if (await shouldRunAgain()) {
        continue
    }

    break
}
