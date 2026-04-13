"""Creates the Kasbnoma catalog if the database is empty (8 readiness + 200 main questions, RU+TJ)."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalog import Cluster, Group, Question, QuestionPhase, ReadinessKind
from app.seed import bank_c1, bank_c2, bank_c3, bank_c4, bank_c5

BANKS = [bank_c1, bank_c2, bank_c3, bank_c4, bank_c5]

CLUSTER_NAMES_RU = [
    "Естественно-технический",
    "Экономика и география",
    "Филология, педагогика и искусство",
    "Социальные науки и право",
    "Медицина, биология и спорт",
]
# Short specialization titles (RU) aligned with G1..G5 per cluster
GROUP_NAMES_RU: list[list[str]] = [
    [
        "IT, программирование и точные науки",
        "Автоматизация, робототехника и электротехника",
        "Машиностроение и производственные технологии",
        "Строительство и инфраструктура",
        "Транспорт и природные ресурсы",
    ],
    [
        "Экономика и финансы",
        "Бухгалтерия и аудит",
        "Менеджмент и управление",
        "Маркетинг, торговля и сервис",
        "География и региональное развитие",
    ],
    [
        "Языки и перевод",
        "Филология и литература",
        "Педагогика и образование",
        "Журналистика, медиа и культура",
        "Искусство и дизайн",
    ],
    [
        "Правоведение",
        "Психология",
        "Политика и международные отношения",
        "История, философия и религиоведение",
        "Социология и социальные науки",
    ],
    [
        "Медицина и здравоохранение",
        "Биология и естественные науки",
        "Сельское хозяйство и экология",
        "Химия и фармацевтические технологии",
        "Спорт и физическая культура",
    ],
]


def seed_if_empty(db: Session) -> None:
    """
    Idempotent seed: only runs when the `questions` table has zero rows.

    To reload after code changes: truncate `questions`, `groups`, `clusters` (respect FK order) or recreate DB.
    """
    count = db.execute(select(func.count()).select_from(Question)).scalar_one()
    if count > 0:
        return

    clusters: list[Cluster] = []
    for i in range(5):
        c = Cluster(code=f"C{i + 1}", name=CLUSTER_NAMES_RU[i], sort_order=i + 1)
        db.add(c)
        db.flush()
        clusters.append(c)

    groups_by_cluster: dict[int, list[Group]] = {}
    for ci, c in enumerate(clusters):
        groups: list[Group] = []
        for gj in range(5):
            g = Group(
                cluster_id=c.id,
                code=f"G{gj + 1}",
                name=GROUP_NAMES_RU[ci][gj],
                sort_order=gj + 1,
            )
            db.add(g)
            db.flush()
            groups.append(g)
        groups_by_cluster[c.id] = groups

    readiness: list[tuple[str, str, ReadinessKind]] = [
        (
            "Что-нибудь вас сегодня беспокоит?",
            "Оё чизе ҳаст, ки имрӯз шуморо ташвиш медиҳад?",
            ReadinessKind.NEGATIVE,
        ),
        (
            "Чувствуете ли вы сегодня усталость?",
            "Имрӯз худро хаста ҳис мекунед?",
            ReadinessKind.NEGATIVE,
        ),
        (
            "Какие чувства вы испытываете, думая о своей карьере?",
            "Ҳангоми фикр кардан дар бораи касб чӣ ҳис мекунед?",
            ReadinessKind.EMOTIONAL,
        ),
        (
            "Чувствуете ли вы сегодня в целом спокойствие?",
            "Оё имрӯз худро умуман ором ҳис мекунед?",
            ReadinessKind.POSITIVE,
        ),
        (
            "Можете ли вы сейчас сосредоточиться на 15-20 минут без отвлечений?",
            "Ҳоло метавонед 15–20 дақиқа бе парешонӣ диққат кунед?",
            ReadinessKind.POSITIVE,
        ),
        (
            "Чувствуете ли вы себя готовым принять решение?",
            "Оё шумо худро барои қабули қарор омода ҳис мекунед?",
            ReadinessKind.POSITIVE,
        ),
        (
            "Считаете ли вы, что знаете свои способности?",
            "Оё шумо фикр мекунед, ки қобилиятҳои худро медонед?",
            ReadinessKind.POSITIVE,
        ),
        (
            "Обычно чувствуете ли вы спокойствие, думая о будущем?",
            "Ҳангоми фикр дар бораи оянда одатан худро ором эҳсос мекунед?",
            ReadinessKind.POSITIVE,
        ),
    ]

    for idx, (ru, tj, kind) in enumerate(readiness, start=1):
        db.add(
            Question(
                phase=QuestionPhase.READINESS,
                text=ru,
                text_tj=tj,
                readiness_kind=kind,
                cluster_id=None,
                group_id=None,
                sort_order=idx,
            )
        )

    q_index = 0
    for ci, c in enumerate(clusters):
        gru = BANKS[ci].groups_ru()
        gtj = BANKS[ci].groups_tj()
        for gj, g in enumerate(groups_by_cluster[c.id]):
            for k in range(8):
                q_index += 1
                db.add(
                    Question(
                        phase=QuestionPhase.MAIN,
                        text=gru[gj][k],
                        text_tj=gtj[gj][k],
                        readiness_kind=None,
                        cluster_id=c.id,
                        group_id=g.id,
                        sort_order=k + 1,
                    )
                )
