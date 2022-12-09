import { constants, accessSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { restoreLogging, trackLogging } from './utils/log-manager';
const { F_OK, R_OK } = constants;

export function verifyAccess(solutionFile: string, inputFile: string, puzzleDefault: string, clearCache?: 'solution'|'input'|'all') {
    try {
        if (!clearCache || clearCache === 'solution' || clearCache === 'all') accessSync(solutionFile, F_OK | R_OK);
        if (!clearCache || clearCache === 'input' || clearCache === 'all') accessSync(inputFile, F_OK | R_OK);
    } catch (e) {
        const { message, path } = e as Error & { syscall: string; path: string };
        if (message.includes('no such file or directory')) {
            console.log(`No such file or directory '${path}'. Did you mean "aoc-run \u001b[1mnew\x1b[0m ${puzzleDefault}"?`)
        } else {
            console.warn(message || e);
        }
        if (!message) process.exit(1);
        return false;
    }
    return true;
}

let linesCache: readonly string[] | undefined;
export function readLines(inputFile: string, clearCache = false) {
    if (clearCache) linesCache = undefined;
    if (linesCache) return linesCache;
    const input = readFileSync(inputFile, {encoding: 'utf-8'});
    const lines = Object.freeze(input.split(/\r?\n/));
    linesCache = lines;
    return lines;
}

let solutionCache: Function | undefined;
export function loadSolution(solutionFile: string, clearCache = false) {
    if (clearCache) {
        solutionCache = undefined;
        delete require.cache[resolve(solutionFile)];
    }
    if (solutionCache) return solutionCache;
    const solution = require(resolve(solutionFile)).default;
    solutionCache = solution;
    return solution;
}

export function execute(solutionCallback: Function, lines: readonly string[], argv: any): readonly [any, number] {
    try {
        trackLogging();
        const start = performance.now();
        const result = solutionCallback(lines, argv);
        const end = performance.now();
        if (restoreLogging()) console.log(); // '\u001b[37m'+'—'.repeat(process.stdout.columns)+'\x1b[0m'
        return [result, end - start] as const;
    } catch(e) {
        console.error(e);
        return [e, -1] as const;
    }
}