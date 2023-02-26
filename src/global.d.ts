declare global {
    var ctx: {
        now: ()=>number,
        random: ()=>number,
        getTxHash:()=>string
    };
}
export { };