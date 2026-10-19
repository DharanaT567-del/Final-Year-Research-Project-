# -*- coding: utf-8 -*-
import csv
import os
import sys

# Change console encoding for Windows stdout display
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Input and Output paths
INPUT_CSV = r'c:\Users\thiyu\Desktop\Final-Year-Research-Project-\mathaka_sinhala_songs_10000.csv'
STRICT_CLASSICAL_OUTPUT = r'c:\Users\thiyu\Desktop\Final-Year-Research-Project-\mathaka_classical_maestros.csv'
GOLDEN_ERA_OUTPUT = r'c:\Users\thiyu\Desktop\Final-Year-Research-Project-\mathaka_classical_and_golden_era.csv'

# Tier 1: Pure Classical & Sarala Gee Maestros (ශාස්ත්‍රීය හා සරල ගී)
STRICT_CLASSICAL_ARTISTS = [
    'අමරදේව', 'ඩබ්ලිව්. ඩී. අමරදේව', 'W D අමරදේව', 'W. D. Amaradeva', 'Pandith Amaradeva',
    'නන්දා මාලනී', 'Nanda Malini',
    'වික්ටර් රත්නායක', 'Victor Rathnayake',
    'සුනිල් එදිරිසිංහ', 'Sunil Edirisinghe',
    'ගුණදාස කපුගේ', 'කපුගේ', 'Gunadasa Kapuge',
    'T M ජයරත්න', 'එච්. එම්. ජයරත්න', 'ටී. එම්. ජයරත්න', 'T. M. Jayaratne',
    'සනත් නන්දසිරි', 'Sanath Nandasiri',
    'අමරසිරි පීරිස්', 'Amarasiri Peiris',
    'කරුණාරත්න දිවුල්ගනේ', 'දිවුල්ගනේ', 'Karunarathna Divulgane',
    'එඩ්වඩ් ජයකොඩි', 'Edward Jayakody',
    'දීපිකා ප්‍රියදර්ශනී', 'Deepika Priyadarshani',
    'සෝමතිලක ජයමහ', 'Somathilaka Jayamaha',
    'මාලනී බුලත්සිංහල', 'Malini Bulathsinghala',
    'මර්වින් පෙරේරා', 'Mervin Perera',
    'නීලා වික්‍රමසිංහ', 'Neela Wickramasinghe',
    'සුජාතා අත්තනායක', 'Sujatha Attanayake',
    'දයාන් විතාරණ', 'Dayan Vitharana',
    'අබේවර්ධන බාලසූරිය', 'Abeywardena Balasooriya',
    'චරිතා ප්‍රියදර්ශනී', 'Charitha Priyadarshani',
    'C T ප්‍රනාන්දු', 'සී. ටී. ප්‍රනාන්දු', 'C. T. Fernando',
    'මොහිදින් බෙග්', 'Mohideen Baig',
    'ලතා වල්පොල', 'Latha Walpola',
    'ධර්මදාස වල්පොල', 'Dharmadasa Walpola',
    'ජගත් වික්‍රමසිංහ', 'Jagath Wickramasinghe',
    'ලක්ෂ්මන් විජේසේකර', 'Lakshman Wijesekara',
    'නෙලූ අධිකාරී', 'Nelu Adhikari',
    'රෝහණ වීරසිංහ', 'Rohana Weerasinghe',
    'දයා රත්න රණතුංග', 'දයාරත්න රණතුංග', 'Dayaratne Ranatunga',
    'සුනිල් ශාන්ත', 'Sunil Santha',
    'ආනන්ද සමරකෝන්', 'Ananda Samarakoon',
    'සෝමසිරි මැදගෙදර', 'Somasiri Medagedara',
    'වේදිකා නාට්‍ය ගීත', 'Stage Drama Songs',
    'නාරද දිසාසේකර', 'Narada Dissasekara',
    'නිරංජලා සරෝජිනී', 'Niranjala Sarojini',
    'සිසිර සේනාරත්න', 'Sisira Senaratne',
    'ඉන්ද්‍රානි සේනාරත්න', 'Indrani Senaratne',
    'අමිතා දළුගම', 'Amitha Dalugama',
    'ජානක වික්‍රමසිංහ', 'Janaka Wickramasinghe',
    'ඉන්ද්‍රජිත් දොලමුල්ල', 'Indrajith Dolamulla'
]

# Tier 2: Additional Golden Era Cinema & Melodic Classics (ස්වර්ණමය යුගයේ සිනමා හා තනු නිර්මාණ)
GOLDEN_ERA_ADDITIONAL = [
    'ජෝතිපාල', 'එච්.ආර්. ජෝතිපාල', 'H R ජෝතිපාල', 'H. R. Jothipala',
    'මිල්ටන් මල්ලවාරච්චි', 'Milton Mallawarachchi',
    'මිල්ටන් පෙරේරා', 'Milton Perera',
    'ඇන්ජලින් ගුණතිලක', 'ඇන්ජලින්', 'Angeline Gunathilake',
    'විජය කුමාරතුංග', 'Vijaya Kumaratunga',
    'ප්‍රියා සූරියසේන', 'Priya Suriyasena',
    'චන්ද්‍රසේන හෙට්ටිආරච්චි', 'චන්ද්‍රෙස්න හෙට්ටිආරච්චි', 'Chandrasena Hettiarachchi',
    'සමිතා මුදුන්කොටුව', 'Samitha Mudunkotuwa',
    'කීර්ති පැස්කුවෙල්', 'Keerthi Pasqual',
    'පුන්සිරි සොයිසා', 'Punsiri Soysa',
    'රූකාන්ත ගුණතිලක', 'රූකාන්ත', 'Rookantha Gunathilake',
    'චන්ද්‍රලේකා පෙරේරා', 'චන්ද්‍රලේකා', 'Chandralekha Perera',
    'කසුන් කල්හාර', 'Kasun Kalhara',
    'නිරෝෂා විරාජිනී', 'Nirosha Virajini',
    'උරේෂා රවිහාරි', 'Uresha Ravihari',
    'සශිකා නිසංසලා', 'Shashika Nisansala',
    'ඉන්ද්‍රාණි පෙරේරා', 'Indrani Perera',
    'ක්‍රිශාන්ත එරන්දක', 'Krishantha Erandaka'
]

def filter_dataset():
    if not os.path.exists(INPUT_CSV):
        print(f'Error: Input file {INPUT_CSV} not found.')
        return

    with open(INPUT_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    total_rows = len(rows)

    strict_classical_rows = []
    golden_era_rows = []

    all_golden_keywords = STRICT_CLASSICAL_ARTISTS + GOLDEN_ERA_ADDITIONAL

    for row in rows:
        artist = (row.get('artist_name') or '').strip()
        artist_lower = artist.lower()

        # Check strict classical
        if any(kw.lower() in artist_lower for kw in STRICT_CLASSICAL_ARTISTS):
            strict_classical_rows.append(row)
            golden_era_rows.append(row)
        elif any(kw.lower() in artist_lower for kw in GOLDEN_ERA_ADDITIONAL):
            golden_era_rows.append(row)

    # Save Strict Classical CSV
    with open(STRICT_CLASSICAL_OUTPUT, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(strict_classical_rows)

    # Save Classical + Golden Era CSV
    with open(GOLDEN_ERA_OUTPUT, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(golden_era_rows)

    print('=' * 60)
    print('SINHALA CLASSICAL MUSIC DATASET FILTERING COMPLETE')
    print('=' * 60)
    print(f'Total Original Songs: {total_rows}')
    print(f'1. Strict Classical Maestros Dataset: {len(strict_classical_rows)} songs -> {STRICT_CLASSICAL_OUTPUT}')
    print(f'2. Classical + Golden Era Melodic Dataset: {len(golden_era_rows)} songs -> {GOLDEN_ERA_OUTPUT}')
    print('-' * 60)

    # Top Artist breakdown for Strict Classical
    artist_counts = {}
    for r in strict_classical_rows:
        art = r['artist_name'].strip()
        artist_counts[art] = artist_counts.get(art, 0) + 1

    print('Top Artists in Strict Classical Dataset:')
    for art, count in sorted(artist_counts.items(), key=lambda x: x[1], reverse=True)[:25]:
        print(f'  - {art}: {count} songs')

if __name__ == '__main__':
    filter_dataset()
