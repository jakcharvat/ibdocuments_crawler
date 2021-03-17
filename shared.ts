import os from 'https://deno.land/x/dos@v0.1.2/mod.ts'


function getCommand(cmd: string[]): string[] {
    const arr = (os.platform() == 'windows' ? ['cmd', '/c'] : [])
    arr.concat(cmd)
    return arr
}


function getDirName(name: string): string {
    if (os.platform() == 'windows') {
        return name.replace(/ /g, '_')
    }
    
    return name
}

export {
    getDirName,
    getCommand
}