export const estimateValues = {
    XS: 1, S: 2, M: 3, L: 5, XL: 8, XXL: 13, XXXL: 21
};

export function totalEffort(moments) {
    return moments.reduce((sum, m) => sum + (estimateValues[m.effortEstimate] || 0), 0);
}