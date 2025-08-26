export async function addProgrammaticAnnotation(entity, coordinates, page) {
    const newAnnotation = {
        id: Date.now() + Math.random(),
        type: 'programmatic',
        polygon: coordinates,
        label: entity.label,
        color: entity.color,
        text: entity.text,
        page,
    };
    return newAnnotation;
}