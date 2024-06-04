type Func<T, R> = (arg: T) => R;

export const pipe = <T>(...functions: Array<Func<T, T>>): Func<T, T>  => {
    return (arg: T): T => {
        return functions.reduce((prevResult, func) => func(prevResult), arg);
    };
}