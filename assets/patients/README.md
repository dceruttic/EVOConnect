# Patient photos

Drop one image per patient here, named after the patient id:

    assets/patients/2126-0418.jpg      → M. Herrera
    assets/patients/2126-0417.jpg      → P. Martínez
    ...

The id is the part after `REV-` on the patient card. `dashboard/js/07` picks the
file up automatically; a missing or broken file falls back to the stylized
avatar, so the registry never shows a hole.

To point a patient at a differently named file, register it instead:

    PATIENT_PHOTOS['2126-0418'] = '/assets/patients/herrera.jpg';

Square images work best (they are cropped to a circle with `object-fit: cover`);
around 400×400 is plenty. Use portraits of people who consented, or
synthetic/licensed stock — these are synthetic demo records and must not be tied
to a real person's identity.
