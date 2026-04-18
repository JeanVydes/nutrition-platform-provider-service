export class Coordinates {
    constructor(public readonly longitude: number, public readonly latitude: number) {
        if (longitude < -180 || longitude > 180) {
            throw new Error("Longitude must be between -180 and 180 degrees.");
        }
        if (latitude < -90 || latitude > 90) {
            throw new Error("Latitude must be between -90 and 90 degrees.");
        }
    }

    toString(): string {
        return `(${this.latitude}, ${this.longitude})`;
    }

    static fromString(coordinates: string): Coordinates {
        const [latitudeStr, longitudeStr] = coordinates.replace(/[()]/g, "").split(",").map(s => s.trim());

        if (!latitudeStr || !longitudeStr) {
            throw new Error("Invalid coordinates format. Expected format: '(latitude, longitude)'.");
        }

        const latitude = parseFloat(latitudeStr);
        const longitude = parseFloat(longitudeStr);
        return new Coordinates(longitude, latitude);
    }
}