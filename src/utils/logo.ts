const getLogo = (url: string): string => {
    return (url || "").startsWith("bitfs") ? null : url
}

export default getLogo;
